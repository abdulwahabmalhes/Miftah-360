import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { TenantIsolationGuard } from '../../apps/api/src/common/guards/tenant-isolation.guard';
import { Role, StandardErrorCode, WorkshopStaffRole } from '@miftah/contracts';

describe('TenantIsolationGuard (E2E Verification)', () => {
  let guard: TenantIsolationGuard;

  beforeEach(() => {
    guard = new TenantIsolationGuard();
  });

  const createMockContext = (user: any, params: any = {}, body: any = {}, query: any = {}) => {
    const request = {
      user,
      params,
      body,
      query,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  it('ALLOWS Workshop A staff to access Workshop A resources', () => {
    const workshopIdA = 'workshop-uuid-a';
    const user = {
      sub: 'user-staff-1',
      role: Role.WORKSHOP_OWNER,
      workshop_id: workshopIdA,
      workshop_staff_role: WorkshopStaffRole.WORKSHOP_OWNER,
    };

    const context = createMockContext(user, { workshopId: workshopIdA });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('REJECTS Workshop A staff attempting to access Workshop B resources (TENANT_MISMATCH)', () => {
    const workshopIdA = 'workshop-uuid-a';
    const workshopIdB = 'workshop-uuid-b';
    const user = {
      sub: 'user-staff-1',
      role: Role.SERVICE_ADVISOR,
      workshop_id: workshopIdA,
      workshop_staff_role: WorkshopStaffRole.SERVICE_ADVISOR,
    };

    const context = createMockContext(user, { workshopId: workshopIdB });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    try {
      guard.canActivate(context);
    } catch (err: any) {
      expect(err.getResponse().code).toBe(StandardErrorCode.TENANT_MISMATCH);
    }
  });

  it('REJECTS Workshop A staff attempting to inject Workshop B ID in the request body', () => {
    const workshopIdA = 'workshop-uuid-a';
    const workshopIdB = 'workshop-uuid-b';
    const user = {
      sub: 'user-staff-1',
      role: Role.WORKSHOP_OWNER,
      workshop_id: workshopIdA,
    };

    const context = createMockContext(user, {}, { workshopId: workshopIdB });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    try {
      guard.canActivate(context);
    } catch (err: any) {
      expect(err.getResponse().code).toBe(StandardErrorCode.TENANT_MISMATCH);
    }
  });

  it('ALLOWS Super Admin to access any workshop resource for platform governance', () => {
    const workshopIdB = 'workshop-uuid-b';
    const user = {
      sub: 'admin-super-1',
      role: Role.SUPER_ADMIN,
      mfa_verified: true,
    };

    const context = createMockContext(user, { workshopId: workshopIdB });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('REJECTS Car Owner without workshop affiliation from accessing workshop tenant routes', () => {
    const workshopIdA = 'workshop-uuid-a';
    const user = {
      sub: 'car-owner-1',
      role: Role.CAR_OWNER,
      workshop_id: undefined,
    };

    const context = createMockContext(user, { workshopId: workshopIdA });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    try {
      guard.canActivate(context);
    } catch (err: any) {
      expect(err.getResponse().code).toBe(StandardErrorCode.TENANT_MISMATCH);
    }
  });
});

