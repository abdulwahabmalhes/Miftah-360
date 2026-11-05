import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import {
  Role,
  WorkshopStatus,
  AdminUpdateWorkshopStatusDto,
  AdminUpdateMarketplaceParticipationDto,
  AdminUpdateModuleEntitlementDto,
  AdminCreateServiceDto,
  AdminUpdateServiceDto,
  AdminCreateBrandDto,
  AdminCreateModelDto,
  JwtPayload,
} from '@miftah/contracts';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminMfaGuard } from '../../common/guards/admin-mfa.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Admin Dashboard Operations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, AdminMfaGuard)
@Roles(Role.SUPER_ADMIN, Role.OPERATIONS_ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // -------------------------------------------------------------
  // WORKSHOPS QUEUE & DETAILS
  // -------------------------------------------------------------
  @Get('workshops')
  @ApiOperation({ summary: 'List workshops for verification queue or management' })
  async listWorkshops(@Query('status') status?: WorkshopStatus, @Query('emirate') emirate?: any) {
    return this.adminService.listWorkshops(status, emirate);
  }

  @Get('workshops/:id')
  @ApiOperation({ summary: 'Get complete workshop details' })
  async getWorkshop(@Param('id') id: string) {
    return this.adminService.getWorkshopDetails(id);
  }

  @Post('workshops/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve workshop (Pending Verification -> Active)' })
  async approveWorkshop(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request & { correlationId?: string },
  ) {
    return this.adminService.approveWorkshop(id, user.sub, req.correlationId || 'none');
  }

  @Post('workshops/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject workshop verification application' })
  async rejectWorkshop(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request & { correlationId?: string },
  ) {
    return this.adminService.rejectWorkshop(id, reason || 'REJECTED_BY_ADMIN', user.sub, req.correlationId || 'none');
  }

  @Post('workshops/:id/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspend active workshop' })
  async suspendWorkshop(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request & { correlationId?: string },
  ) {
    return this.adminService.suspendWorkshop(id, reason || 'SUSPENDED_BY_ADMIN', user.sub, req.correlationId || 'none');
  }

  @Post('workshops/:id/reactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reactivate suspended or inactive workshop' })
  async reactivateWorkshop(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request & { correlationId?: string },
  ) {
    return this.adminService.reactivateWorkshop(id, user.sub, req.correlationId || 'none');
  }

  @Post('workshops/:id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate workshop (Active/Suspended -> Inactive)' })
  async deactivateWorkshop(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request & { correlationId?: string },
  ) {
    return this.adminService.deactivateWorkshop(id, reason || 'DEACTIVATED_BY_ADMIN', user.sub, req.correlationId || 'none');
  }

  @Patch('workshops/:id/marketplace-participation')
  @ApiOperation({ summary: 'Toggle workshop marketplace participation' })
  async setMarketplaceParticipation(
    @Param('id') id: string,
    @Body() dto: AdminUpdateMarketplaceParticipationDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request & { correlationId?: string },
  ) {
    return this.adminService.setMarketplaceParticipation(id, dto, user.sub, req.correlationId || 'none');
  }

  // -------------------------------------------------------------
  // MODULES & ENTITLEMENTS (Admin Only)
  // -------------------------------------------------------------
  @Get('modules')
  @ApiOperation({ summary: 'List all platform modules' })
  async listModules() {
    return this.adminService.listModules();
  }

  @Get('workshops/:id/entitlements')
  @ApiOperation({ summary: 'Get entitlements for a specific workshop' })
  async getWorkshopEntitlements(@Param('id') workshopId: string) {
    return this.adminService.getWorkshopEntitlements(workshopId);
  }

  @Post('workshops/:id/entitlements/:moduleCode/enable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enable module for a workshop' })
  async enableModule(
    @Param('id') workshopId: string,
    @Param('moduleCode') moduleCode: string,
    @Body('reason') reason: string,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request & { correlationId?: string },
  ) {
    return this.adminService.updateModuleEntitlement(
      workshopId,
      moduleCode,
      { state: 'ENABLED' as any, reason: reason || 'ADMIN_ENABLED' },
      user.sub,
      req.correlationId || 'none',
    );
  }

  @Post('workshops/:id/entitlements/:moduleCode/disable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disable module for a workshop' })
  async disableModule(
    @Param('id') workshopId: string,
    @Param('moduleCode') moduleCode: string,
    @Body('reason') reason: string,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request & { correlationId?: string },
  ) {
    return this.adminService.updateModuleEntitlement(
      workshopId,
      moduleCode,
      { state: 'DISABLED' as any, reason: reason || 'ADMIN_DISABLED' },
      user.sub,
      req.correlationId || 'none',
    );
  }

  // -------------------------------------------------------------
  // MASTER DATA MANAGEMENT
  // -------------------------------------------------------------
  @Post('services')
  @ApiOperation({ summary: 'Create new canonical service in taxonomy' })
  async createService(
    @Body() dto: AdminCreateServiceDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request & { correlationId?: string },
  ) {
    return this.adminService.createService(dto, user.sub, req.correlationId || 'none');
  }

  @Patch('services/:id')
  @ApiOperation({ summary: 'Update canonical service details or status' })
  async updateService(
    @Param('id') id: string,
    @Body() dto: AdminUpdateServiceDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request & { correlationId?: string },
  ) {
    return this.adminService.updateService(id, dto, user.sub, req.correlationId || 'none');
  }

  @Post('vehicle-brands')
  @ApiOperation({ summary: 'Create new vehicle brand' })
  async createBrand(
    @Body() dto: AdminCreateBrandDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request & { correlationId?: string },
  ) {
    return this.adminService.createBrand(dto, user.sub, req.correlationId || 'none');
  }

  @Post('vehicle-brands/:brandId/models')
  @ApiOperation({ summary: 'Add model to brand' })
  async createModel(
    @Param('brandId') brandId: string,
    @Body() dto: AdminCreateModelDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request & { correlationId?: string },
  ) {
    return this.adminService.createModel(brandId, dto, user.sub, req.correlationId || 'none');
  }
}

