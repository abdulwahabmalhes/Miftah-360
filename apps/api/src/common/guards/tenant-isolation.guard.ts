import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { StandardErrorCode, Role } from '@miftah/contracts';

@Injectable()
export class TenantIsolationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException({
        code: StandardErrorCode.UNAUTHORIZED,
        message: 'Authentication required for tenant operations',
      });
    }

    // Platform Admins can inspect across tenants with audit
    if (user.role === Role.SUPER_ADMIN || user.role === Role.OPERATIONS_ADMIN) {
      return true;
    }

    // Determine target workshop from route parameters, query, or body
    const targetWorkshopId =
      request.params?.workshopId ||
      request.params?.tenantId ||
      request.query?.workshopId ||
      request.query?.tenantId ||
      request.body?.workshopId ||
      request.body?.workshop_id ||
      request.body?.tenantId;

    if (targetWorkshopId && user.workshop_id && targetWorkshopId !== user.workshop_id) {
      console.warn('🚨 TENANT MISMATCH DETECTED:', {
        url: request.url,
        method: request.method,
        params: request.params,
        query: request.query,
        body: request.body,
        userWorkshopId: user.workshop_id,
        targetWorkshopId,
      });
    }

    // For workshop staff, they MUST have a workshop_id and match the target
    if (user.workshop_id) {
      if (targetWorkshopId && targetWorkshopId !== user.workshop_id) {
        throw new ForbiddenException({
          code: StandardErrorCode.TENANT_MISMATCH,
          message: 'Access to resources outside of your assigned workshop tenant is strictly prohibited',
        });
      }
      return true;
    }

    // If an endpoint explicitly requires a workshop tenant and the user has none
    if (targetWorkshopId && !user.workshop_id) {
      throw new ForbiddenException({
        code: StandardErrorCode.TENANT_MISMATCH,
        message: 'Actor is not affiliated with a workshop tenant',
      });
    }

    return true;
  }
}

