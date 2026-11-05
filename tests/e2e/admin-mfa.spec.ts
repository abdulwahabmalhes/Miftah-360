import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AdminMfaGuard } from '../../apps/api/src/common/guards/admin-mfa.guard';
import { Role, StandardErrorCode } from '@miftah/contracts';

describe('Admin Mandatory MFA (E2E Verification)', () => {
  let guard: AdminMfaGuard;

  beforeEach(() => {
    guard = new AdminMfaGuard();
  });

  const createMockContext = (user: any) => {
    const request = { user };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  it('REJECTS Admin actor when token lacks mfa_verified flag (MFA_REQUIRED)', () => {
    const adminUser = {
      sub: 'admin-super-1',
      role: Role.SUPER_ADMIN,
      mfa_verified: false, // NOT VERIFIED
    };

    const context = createMockContext(adminUser);
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    try {
      guard.canActivate(context);
    } catch (err: any) {
      expect(err.getResponse().code).toBe(StandardErrorCode.MFA_REQUIRED);
    }
  });

  it('ALLOWS Admin actor when token has mfa_verified = true', () => {
    const adminUser = {
      sub: 'admin-super-1',
      role: Role.SUPER_ADMIN,
      mfa_verified: true, // VERIFIED
    };

    const context = createMockContext(adminUser);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('ALLOWS Non-Admin actors (Car Owner, Workshop Staff) without requiring Admin MFA', () => {
    const carOwner = {
      sub: 'user-1',
      role: Role.CAR_OWNER,
    };
    const workshopOwner = {
      sub: 'staff-1',
      role: Role.WORKSHOP_OWNER,
      workshop_id: 'ws-1',
    };

    expect(guard.canActivate(createMockContext(carOwner))).toBe(true);
    expect(guard.canActivate(createMockContext(workshopOwner))).toBe(true);
  });
});

