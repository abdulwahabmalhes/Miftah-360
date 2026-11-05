import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Role, StandardErrorCode } from '@miftah/contracts';

@Injectable()
export class AdminMfaGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException({
        code: StandardErrorCode.UNAUTHORIZED,
        message: 'Authentication required',
      });
    }

    const isAdmin =
      user.role === Role.SUPER_ADMIN ||
      user.role === Role.OPERATIONS_ADMIN ||
      user.role === Role.SUPPORT_ADMIN;

    if (isAdmin && !user.mfa_verified) {
      throw new UnauthorizedException({
        code: StandardErrorCode.MFA_REQUIRED,
        message: 'Admin operations require verified Multi-Factor Authentication (MFA)',
      });
    }

    return true;
  }
}

