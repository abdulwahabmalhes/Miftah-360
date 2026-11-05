import {
  Controller,
  Get,
  Patch,
  Put,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import {
  UpdateWorkshopProfileDto,
  UpdateWorkshopHoursDto,
  UpdateWorkshopBrandsDto,
  UpdateWorkshopServiceDto,
  InviteStaffDto,
  UpdateStaffRoleDto,
  Role,
  WorkshopStaffRole,
  StaffStatus,
  JwtPayload,
} from '@miftah/contracts';
import { WorkshopService } from './workshop.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantIsolationGuard } from '../../common/guards/tenant-isolation.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Workshop OS Core Operations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantIsolationGuard)
@Controller('workshop')
export class WorkshopController {
  constructor(private readonly workshopService: WorkshopService) {}

  // -------------------------------------------------------------
  // PROFILE, LOCATION & SERVICES
  // -------------------------------------------------------------
  @Get('me')
  @ApiOperation({ summary: 'Get current workshop profile and details' })
  async getMyWorkshop(@CurrentUser() user: JwtPayload) {
    return this.workshopService.getMyWorkshop(user.workshop_id!);
  }

  @Patch('me')
  @Roles(Role.WORKSHOP_OWNER, WorkshopStaffRole.WORKSHOP_OWNER)
  @ApiOperation({ summary: 'Update workshop profile and primary location' })
  async updateMyWorkshop(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateWorkshopProfileDto,
    @Req() req: Request & { correlationId?: string },
  ) {
    return this.workshopService.updateMyWorkshop(
      user.workshop_id!,
      dto,
      user.sub,
      req.correlationId || 'none',
    );
  }

  @Put('me/hours')
  @Roles(Role.WORKSHOP_OWNER, WorkshopStaffRole.WORKSHOP_OWNER)
  @ApiOperation({ summary: 'Configure operating hours' })
  async updateWorkingHours(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateWorkshopHoursDto,
    @Req() req: Request & { correlationId?: string },
  ) {
    return this.workshopService.updateWorkingHours(
      user.workshop_id!,
      dto,
      user.sub,
      req.correlationId || 'none',
    );
  }

  @Put('me/brands')
  @Roles(Role.WORKSHOP_OWNER, WorkshopStaffRole.WORKSHOP_OWNER)
  @ApiOperation({ summary: 'Configure supported vehicle brands' })
  async updateSupportedBrands(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateWorkshopBrandsDto,
    @Req() req: Request & { correlationId?: string },
  ) {
    return this.workshopService.updateSupportedBrands(
      user.workshop_id!,
      dto,
      user.sub,
      req.correlationId || 'none',
    );
  }

  @Get('me/services')
  @ApiOperation({ summary: 'List workshop service configurations alongside central taxonomy' })
  async getWorkshopServices(@CurrentUser() user: JwtPayload) {
    return this.workshopService.getWorkshopServices(user.workshop_id!);
  }

  @Put('me/services/:serviceId')
  @Roles(Role.WORKSHOP_OWNER, WorkshopStaffRole.WORKSHOP_OWNER)
  @ApiOperation({ summary: 'Enable/disable service and set non-binding Starting From price' })
  async updateWorkshopService(
    @CurrentUser() user: JwtPayload,
    @Param('serviceId') serviceId: string,
    @Body() dto: UpdateWorkshopServiceDto,
    @Req() req: Request & { correlationId?: string },
  ) {
    return this.workshopService.updateWorkshopService(
      user.workshop_id!,
      serviceId,
      dto,
      user.sub,
      req.correlationId || 'none',
    );
  }

  // -------------------------------------------------------------
  // STAFF MANAGEMENT (Fixed Roles)
  // -------------------------------------------------------------
  @Get('staff')
  @Roles(Role.WORKSHOP_OWNER, WorkshopStaffRole.WORKSHOP_OWNER)
  @ApiOperation({ summary: 'List workshop staff members' })
  async listStaff(@CurrentUser() user: JwtPayload) {
    return this.workshopService.listStaff(user.workshop_id!);
  }

  @Post('staff/invitations')
  @Roles(Role.WORKSHOP_OWNER, WorkshopStaffRole.WORKSHOP_OWNER)
  @ApiOperation({ summary: 'Invite or add a staff member with a fixed role' })
  async inviteStaff(
    @CurrentUser() user: JwtPayload,
    @Body() dto: InviteStaffDto,
    @Req() req: Request & { correlationId?: string },
  ) {
    return this.workshopService.inviteStaff(
      user.workshop_id!,
      dto,
      user.sub,
      req.correlationId || 'none',
    );
  }

  @Patch('staff/:membershipId/role')
  @Roles(Role.WORKSHOP_OWNER, WorkshopStaffRole.WORKSHOP_OWNER)
  @ApiOperation({ summary: 'Change fixed role of a staff member' })
  async updateStaffRole(
    @CurrentUser() user: JwtPayload,
    @Param('membershipId') membershipId: string,
    @Body() dto: UpdateStaffRoleDto,
    @Req() req: Request & { correlationId?: string },
  ) {
    return this.workshopService.updateStaffRole(
      user.workshop_id!,
      membershipId,
      dto,
      user.sub,
      req.correlationId || 'none',
    );
  }

  @Post('staff/:membershipId/disable')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.WORKSHOP_OWNER, WorkshopStaffRole.WORKSHOP_OWNER)
  @ApiOperation({ summary: 'Disable staff member (immediately revokes active sessions)' })
  async disableStaff(
    @CurrentUser() user: JwtPayload,
    @Param('membershipId') membershipId: string,
    @Req() req: Request & { correlationId?: string },
  ) {
    return this.workshopService.setStaffStatus(
      user.workshop_id!,
      membershipId,
      StaffStatus.DISABLED,
      user.sub,
      req.correlationId || 'none',
    );
  }

  @Post('staff/:membershipId/enable')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.WORKSHOP_OWNER, WorkshopStaffRole.WORKSHOP_OWNER)
  @ApiOperation({ summary: 'Re-enable disabled staff member' })
  async enableStaff(
    @CurrentUser() user: JwtPayload,
    @Param('membershipId') membershipId: string,
    @Req() req: Request & { correlationId?: string },
  ) {
    return this.workshopService.setStaffStatus(
      user.workshop_id!,
      membershipId,
      StaffStatus.ACTIVE,
      user.sub,
      req.correlationId || 'none',
    );
  }

  // -------------------------------------------------------------
  // BASIC CUSTOMERS & VEHICLES VIEW
  // -------------------------------------------------------------
  @Get('customers')
  @ApiOperation({ summary: 'List recent customers and their vehicles in this workshop' })
  async listCustomers(@CurrentUser() user: JwtPayload) {
    return this.workshopService.listCustomers(user.workshop_id!);
  }
}

