import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../apps/api/src/common/guards/roles.guard';
import { Role, WorkshopStaffRole, StandardErrorCode } from '@miftah/contracts';

describe('RBAC & Role Boundaries (E2E Verification)', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockContext = (user: any) => {
    const request = { user };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  };

  it('ALLOWS Service Advisor to manage quotes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
      Role.WORKSHOP_OWNER,
      WorkshopStaffRole.SERVICE_ADVISOR,
    ]);

    const user = {
      sub: 'advisor-1',
      role: Role.WORKSHOP_OWNER,
      workshop_staff_role: WorkshopStaffRole.SERVICE_ADVISOR,
    };

    const context = createMockContext(user);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('DENIES Receptionist from managing or issuing quotes', () => {
    // Quote endpoints permit only Workshop Owner or Service Advisor
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
      WorkshopStaffRole.WORKSHOP_OWNER,
      WorkshopStaffRole.SERVICE_ADVISOR,
    ]);

    const user = {
      sub: 'reception-1',
      role: Role.WORKSHOP_OWNER,
      workshop_staff_role: WorkshopStaffRole.RECEPTION,
    };

    const context = createMockContext(user);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    try {
      guard.canActivate(context);
    } catch (err: any) {
      expect(err.getResponse().code).toBe(StandardErrorCode.FORBIDDEN);
    }
  });

  it('DENIES Technician from altering financial totals or issuing quotes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
      WorkshopStaffRole.WORKSHOP_OWNER,
      WorkshopStaffRole.SERVICE_ADVISOR,
    ]);

    const user = {
      sub: 'tech-1',
      role: Role.WORKSHOP_OWNER,
      workshop_staff_role: WorkshopStaffRole.TECHNICIAN,
    };

    const context = createMockContext(user);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('DENIES Workshop Owner from toggling platform module entitlements (Admin only)', () => {
    // Module entitlement endpoints strictly require SUPER_ADMIN or OPERATIONS_ADMIN
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([
      Role.SUPER_ADMIN,
      Role.OPERATIONS_ADMIN,
    ]);

    const user = {
      sub: 'owner-1',
      role: Role.WORKSHOP_OWNER,
      workshop_staff_role: WorkshopStaffRole.WORKSHOP_OWNER,
    };

    const context = createMockContext(user);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('ALLOWS only Car Owner to accept or reject user quotes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.CAR_OWNER]);

    const carOwner = { sub: 'owner-user-1', role: Role.CAR_OWNER };
    const workshopOwner = { sub: 'ws-owner-1', role: Role.WORKSHOP_OWNER };

    expect(guard.canActivate(createMockContext(carOwner))).toBe(true);
    expect(() => guard.canActivate(createMockContext(workshopOwner))).toThrow(ForbiddenException);
  });
});

