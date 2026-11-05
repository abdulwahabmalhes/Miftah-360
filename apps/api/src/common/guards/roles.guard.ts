import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, WorkshopStaffRole, StandardErrorCode } from '@miftah/contracts';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<(Role | WorkshopStaffRole)[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException({
        code: StandardErrorCode.FORBIDDEN,
        message: 'No authenticated actor present',
      });
    }

    const effectiveRole = user.workshop_staff_role || user.role;
    const hasRole =
      requiredRoles.includes(effectiveRole) ||
      (user.role === Role.SUPER_ADMIN); // Super Admin bypasses if needed

    if (!hasRole) {
      throw new ForbiddenException({
        code: StandardErrorCode.FORBIDDEN,
        message: `User does not have required permissions: [${requiredRoles.join(', ')}]`,
      });
    }

    return true;
  }
}

