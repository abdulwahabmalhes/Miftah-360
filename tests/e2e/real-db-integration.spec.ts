import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient, WorkshopStatus, Emirate, UserStatus, StaffStatus } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../../apps/api/src/common/guards/jwt-auth.guard';
import { TenantIsolationGuard } from '../../apps/api/src/common/guards/tenant-isolation.guard';
import { RolesGuard } from '../../apps/api/src/common/guards/roles.guard';
import { AdminMfaGuard } from '../../apps/api/src/common/guards/admin-mfa.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Role, WorkshopStaffRole, AdminRole, StandardErrorCode, AuthProvider } from '@miftah/contracts';
import { AuthService } from '../../apps/api/src/modules/auth/auth.service';
import { AuditService } from '../../apps/api/src/modules/audit/audit.service';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';

describe('Real PostgreSQL Integration Tests (Wave 1 Gate)', () => {
  let prisma: PrismaService;
  let jwtService: JwtService;
  let authService: AuthService;
  let auditService: AuditService;
  let tenantGuard: TenantIsolationGuard;
  let rolesGuard: RolesGuard;
  let mfaGuard: AdminMfaGuard;
  let jwtGuard: JwtAuthGuard;
  let reflector: Reflector;

  const runId = Date.now();

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();

    jwtService = new JwtService({
      secret: process.env.JWT_SECRET || 'test_jwt_secret_miftah_360',
    });

    auditService = new AuditService(prisma);
    authService = new AuthService(prisma, jwtService, auditService);

    tenantGuard = new TenantIsolationGuard();
    reflector = new Reflector();
    rolesGuard = new RolesGuard(reflector);
    mfaGuard = new AdminMfaGuard();
    jwtGuard = new JwtAuthGuard(jwtService, prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  const createMockContext = (user: any, params: any = {}, body: any = {}, query: any = {}, token?: string) => {
    const request: any = {
      user,
      params,
      body,
      query,
      headers: token ? { authorization: `Bearer ${token}` } : {},
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  };

  // ---------------------------------------------------------------
  // 1. WORKSHOP OWNERSHIP & REAL DB CONSTRAINTS
  // ---------------------------------------------------------------
  it('enforces Workshop Ownership and Tenancy constraints in PostgreSQL', async () => {
    // Create Owner User in real DB
    const owner = await prisma.user.create({
      data: {
        fullName: `Owner ${runId}`,
        email: `owner_${runId}@workshop-a.ae`,
        status: UserStatus.ACTIVE,
      },
    });

    // Create Workshop A in real DB
    const workshopA = await prisma.workshop.create({
      data: {
        ownerUserId: owner.id,
        legalName: `Workshop A ${runId} LLC`,
        displayNameEn: `Workshop A ${runId}`,
        displayNameAr: `ورشة أ ${runId}`,
        status: WorkshopStatus.ACTIVE,
        emirate: Emirate.DUBAI,
        addressText: 'Al Quoz Industrial Area 3, Dubai',
        latitude: 25.132,
        longitude: 55.234,
        primaryPhone: '+97143331111',
        primaryEmail: `info@workshop-a-${runId}.ae`,
        marketplaceParticipation: true,
      },
    });

    expect(workshopA.id).toBeDefined();
    expect(workshopA.ownerUserId).toBe(owner.id);

    // Verify foreign key constraint: creating workshop with non-existent owner fails
    await expect(
      prisma.workshop.create({
        data: {
          ownerUserId: '00000000-0000-0000-0000-000000000000',
          legalName: 'Invalid LLC',
          displayNameEn: 'Invalid',
          displayNameAr: 'غير صالح',
          status: WorkshopStatus.ACTIVE,
          emirate: Emirate.DUBAI,
          addressText: 'Dubai',
          latitude: 25.0,
          longitude: 55.0,
          primaryPhone: '+97140000000',
          primaryEmail: 'invalid@test.ae',
        },
      }),
    ).rejects.toThrow();
  });

  // ---------------------------------------------------------------
  // 2. TENANT ISOLATION AGAINST REAL WORKSHOPS
  // ---------------------------------------------------------------
  it('strictly blocks cross-tenant access between Workshop A and Workshop B', async () => {
    const ownerA = await prisma.user.create({
      data: { fullName: `Owner A ${runId}`, email: `owner_a_${runId}@test.ae` },
    });
    const workshopA = await prisma.workshop.create({
      data: {
        ownerUserId: ownerA.id,
        legalName: `WS A ${runId}`,
        displayNameEn: `WS A ${runId}`,
        displayNameAr: `ورشة أ`,
        emirate: Emirate.DUBAI,
        addressText: 'Dubai',
        latitude: 25.1,
        longitude: 55.2,
        primaryPhone: '+97141111111',
        primaryEmail: `wsa_${runId}@test.ae`,
      },
    });

    const ownerB = await prisma.user.create({
      data: { fullName: `Owner B ${runId}`, email: `owner_b_${runId}@test.ae` },
    });
    const workshopB = await prisma.workshop.create({
      data: {
        ownerUserId: ownerB.id,
        legalName: `WS B ${runId}`,
        displayNameEn: `WS B ${runId}`,
        displayNameAr: `ورشة ب`,
        emirate: Emirate.SHARJAH,
        addressText: 'Sharjah',
        latitude: 25.3,
        longitude: 55.4,
        primaryPhone: '+97161111111',
        primaryEmail: `wsb_${runId}@test.ae`,
      },
    });

    // Staff member of Workshop A
    const staffUserA = {
      sub: 'staff-a',
      role: Role.WORKSHOP_OWNER,
      workshop_id: workshopA.id,
      workshop_staff_role: WorkshopStaffRole.SERVICE_ADVISOR,
    };

    // Attempt to access Workshop B
    const crossTenantContext = createMockContext(staffUserA, { workshopId: workshopB.id });
    expect(() => tenantGuard.canActivate(crossTenantContext)).toThrow(ForbiddenException);

    // Access own Workshop A
    const ownTenantContext = createMockContext(staffUserA, { workshopId: workshopA.id });
    expect(tenantGuard.canActivate(ownTenantContext)).toBe(true);
  });

  // ---------------------------------------------------------------
  // 3. RBAC BOUNDARIES
  // ---------------------------------------------------------------
  it('enforces RBAC role boundaries (Receptionist blocked from quote management)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
      WorkshopStaffRole.WORKSHOP_OWNER,
      WorkshopStaffRole.SERVICE_ADVISOR,
    ]);

    const receptionStaff = {
      sub: 'reception-1',
      role: Role.WORKSHOP_OWNER,
      workshop_staff_role: WorkshopStaffRole.RECEPTION,
    };

    const advisorStaff = {
      sub: 'advisor-1',
      role: Role.WORKSHOP_OWNER,
      workshop_staff_role: WorkshopStaffRole.SERVICE_ADVISOR,
    };

    expect(() => rolesGuard.canActivate(createMockContext(receptionStaff))).toThrow(ForbiddenException);
    expect(rolesGuard.canActivate(createMockContext(advisorStaff))).toBe(true);
  });

  // ---------------------------------------------------------------
  // 4. ACCOUNT LINKING UNIQUENESS IN REAL POSTGRESQL
  // ---------------------------------------------------------------
  it('links identities without duplicating user records in PostgreSQL', async () => {
    const phone = `+97150${Math.floor(1000000 + Math.random() * 9000000)}`;

    // 1. Request OTP
    await authService.requestOtp({ phone });

    // 2. Verify OTP -> Creates user 1
    const res1 = await authService.verifyOtp({ phone, code: '123456' }, 'corr-1');
    const userId = res1.user.id;

    // Verify user exists in PostgreSQL
    const dbUser = await prisma.user.findUnique({ where: { id: userId } });
    expect(dbUser).toBeDefined();
    expect(dbUser?.phoneE164).toBe(phone);

    // 3. Request OTP again for same phone
    await authService.requestOtp({ phone });

    // 4. Verify OTP again -> Must REUSE existing user, not create duplicate
    const res2 = await authService.verifyOtp({ phone, code: '123456' }, 'corr-2');
    expect(res2.user.id).toBe(userId);

    const totalUsersWithPhone = await prisma.user.count({ where: { phoneE164: phone } });
    expect(totalUsersWithPhone).toBe(1);
  });

  // ---------------------------------------------------------------
  // 5. STAFF DEACTIVATION & SESSION REVOCATION IN REAL DB
  // ---------------------------------------------------------------
  it('revokes API access immediately when staff member is DISABLED in database', async () => {
    const user = await prisma.user.create({
      data: { fullName: `Tech ${runId}`, email: `tech_${runId}@ws.ae` },
    });

    const owner = await prisma.user.create({
      data: { fullName: `Owner ${runId}`, email: `owner_ws_${runId}@ws.ae` },
    });

    const ws = await prisma.workshop.create({
      data: {
        ownerUserId: owner.id,
        legalName: `WS Tech ${runId}`,
        displayNameEn: `WS Tech ${runId}`,
        displayNameAr: `ورشة تقني`,
        emirate: Emirate.DUBAI,
        addressText: 'Dubai',
        latitude: 25.1,
        longitude: 55.2,
        primaryPhone: '+97142222222',
        primaryEmail: `tech_ws_${runId}@test.ae`,
      },
    });

    const staff = await prisma.workshopStaff.create({
      data: {
        workshopId: ws.id,
        userId: user.id,
        role: WorkshopStaffRole.TECHNICIAN,
        status: StaffStatus.ACTIVE,
      },
    });

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        tokenVersion: 1,
        expiresAt: new Date(Date.now() + 3600000),
      },
    });

    const token = await jwtService.signAsync({
      sub: user.id,
      role: Role.WORKSHOP_OWNER,
      workshop_id: ws.id,
      workshop_staff_role: WorkshopStaffRole.TECHNICIAN,
      session_id: session.id,
      token_version: 1,
    });

    const activeContext = createMockContext(null, {}, {}, {}, token);
    const canAccessBefore = await jwtGuard.canActivate(activeContext);
    expect(canAccessBefore).toBe(true);

    // Disable staff in real PostgreSQL database
    await prisma.workshopStaff.update({
      where: { id: staff.id },
      data: { status: StaffStatus.DISABLED },
    });

    // Next request must be rejected with TOKEN_REVOKED
    await expect(jwtGuard.canActivate(activeContext)).rejects.toThrow(UnauthorizedException);
  });

  // ---------------------------------------------------------------
  // 6. ADMIN MANDATORY MFA ENFORCEMENT
  // ---------------------------------------------------------------
  it('enforces Admin MFA: rejects operations when token lacks mfa_verified', () => {
    const unverifiedAdmin = {
      sub: 'admin-1',
      role: Role.SUPER_ADMIN,
      mfa_verified: false,
    };

    const verifiedAdmin = {
      sub: 'admin-1',
      role: Role.SUPER_ADMIN,
      mfa_verified: true,
    };

    expect(() => mfaGuard.canActivate(createMockContext(unverifiedAdmin))).toThrow(UnauthorizedException);
    expect(mfaGuard.canActivate(createMockContext(verifiedAdmin))).toBe(true);
  });
});

