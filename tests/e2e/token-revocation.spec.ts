import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../../apps/api/src/common/guards/jwt-auth.guard';
import { PrismaService } from '../../apps/api/src/prisma/prisma.service';
import { Role, StaffStatus, StandardErrorCode } from '@miftah/contracts';

describe('Token Revocation & Session Lifecycle (E2E Verification)', () => {
  let guard: JwtAuthGuard;
  let jwtService: JwtService;
  let prismaMock: any;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test_jwt_secret';
    jwtService = new JwtService({ secret: 'test_jwt_secret' });
    prismaMock = {
      session: {
        findUnique: jest.fn(),
      },
      workshopStaff: {
        findUnique: jest.fn(),
      },
    };
    guard = new JwtAuthGuard(jwtService, prismaMock as unknown as PrismaService);
  });

  const createMockContext = (token: string) => {
    const request = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  it('ALLOWS valid active token with non-revoked session', async () => {
    const payload = {
      sub: 'user-123',
      role: Role.CAR_OWNER,
      session_id: 'session-uuid-1',
      token_version: 1,
    };
    const token = jwtService.sign(payload);

    prismaMock.session.findUnique.mockResolvedValue({
      id: 'session-uuid-1',
      isRevoked: false,
      tokenVersion: 1,
    });

    const context = createMockContext(token);
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('REJECTS token if session is marked as revoked in database (TOKEN_REVOKED)', async () => {
    const payload = {
      sub: 'user-123',
      role: Role.CAR_OWNER,
      session_id: 'session-uuid-1',
      token_version: 1,
    };
    const token = jwtService.sign(payload);

    prismaMock.session.findUnique.mockResolvedValue({
      id: 'session-uuid-1',
      isRevoked: true, // REVOKED
      tokenVersion: 1,
    });

    const context = createMockContext(token);
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    try {
      await guard.canActivate(context);
    } catch (err: any) {
      expect(err.getResponse().code).toBe(StandardErrorCode.TOKEN_REVOKED);
    }
  });

  it('REJECTS token if token_version is superseded by rotation (TOKEN_REVOKED)', async () => {
    const payload = {
      sub: 'user-123',
      role: Role.CAR_OWNER,
      session_id: 'session-uuid-1',
      token_version: 1, // OLD VERSION
    };
    const token = jwtService.sign(payload);

    prismaMock.session.findUnique.mockResolvedValue({
      id: 'session-uuid-1',
      isRevoked: false,
      tokenVersion: 2, // ROTATED TO VERSION 2
    });

    const context = createMockContext(token);
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    try {
      await guard.canActivate(context);
    } catch (err: any) {
      expect(err.getResponse().code).toBe(StandardErrorCode.TOKEN_REVOKED);
    }
  });

  it('IMMEDIATELY REJECTS workshop staff member if status is set to DISABLED', async () => {
    const payload = {
      sub: 'staff-user-1',
      role: Role.WORKSHOP_OWNER,
      workshop_id: 'workshop-uuid-1',
      session_id: 'session-uuid-2',
      token_version: 1,
    };
    const token = jwtService.sign(payload);

    prismaMock.session.findUnique.mockResolvedValue({
      id: 'session-uuid-2',
      isRevoked: false,
      tokenVersion: 1,
    });

    // Staff member was disabled by workshop owner
    prismaMock.workshopStaff.findUnique.mockResolvedValue({
      workshopId: 'workshop-uuid-1',
      userId: 'staff-user-1',
      status: StaffStatus.DISABLED,
    });

    const context = createMockContext(token);
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    try {
      await guard.canActivate(context);
    } catch (err: any) {
      expect(err.getResponse().code).toBe(StandardErrorCode.TOKEN_REVOKED);
      expect(err.getResponse().message).toContain('disabled');
    }
  });
});

