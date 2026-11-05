import { SetMetadata } from '@nestjs/common';
import { Role, WorkshopStaffRole } from '@miftah/contracts';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: (Role | WorkshopStaffRole)[]) => SetMetadata(ROLES_KEY, roles);

