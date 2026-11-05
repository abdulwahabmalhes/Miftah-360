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
  CreateVehicleDto,
  UpdateVehicleDto,
  VehicleStatus,
  JwtPayload,
} from '@miftah/contracts';
import { VehiclesService } from './vehicles.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Car Owner Garage & Vehicles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  @ApiOperation({ summary: 'List vehicles in user garage (active or archived)' })
  async listVehicles(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: VehicleStatus,
  ) {
    return this.vehiclesService.listUserVehicles(user.sub, status || VehicleStatus.ACTIVE);
  }

  @Post()
  @ApiOperation({ summary: 'Add a new vehicle to the garage' })
  async createVehicle(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateVehicleDto,
    @Req() req: Request & { correlationId?: string },
  ) {
    return this.vehiclesService.createVehicle(user.sub, dto, req.correlationId || 'none');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vehicle profile details' })
  async getVehicle(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.vehiclesService.getVehicleDetails(id, user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update vehicle details' })
  async updateVehicle(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto,
    @Req() req: Request & { correlationId?: string },
  ) {
    return this.vehiclesService.updateVehicle(id, user.sub, dto, req.correlationId || 'none');
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive vehicle (hides from active garage, preserves history)' })
  async archiveVehicle(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Req() req: Request & { correlationId?: string },
  ) {
    return this.vehiclesService.setVehicleStatus(
      id,
      user.sub,
      VehicleStatus.ARCHIVED,
      req.correlationId || 'none',
    );
  }

  @Post(':id/unarchive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unarchive vehicle' })
  async unarchiveVehicle(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Req() req: Request & { correlationId?: string },
  ) {
    return this.vehiclesService.setVehicleStatus(
      id,
      user.sub,
      VehicleStatus.ACTIVE,
      req.correlationId || 'none',
    );
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get maintenance history for vehicle' })
  async getHistory(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.vehiclesService.getVehicleHistory(id, user.sub);
  }

  @Get(':id/reminders')
  @ApiOperation({ summary: 'Get vehicle maintenance & registration reminders' })
  async getReminders(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.vehiclesService.getVehicleReminders(id, user.sub);
  }
}

