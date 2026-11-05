import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtPayload, Role } from '@miftah/contracts';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantIsolationGuard } from '../../common/guards/tenant-isolation.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CheckInVehicleDto,
  ConfirmBookingDto,
  MarkNoShowDto,
  CancelBookingDto,
  AcceptProposedTimeDto,
  QueryBookingsDto,
} from './dto/bookings.dto';

// -------------------------------------------------------------
// 1. WORKSHOP OS CONTROLLER
// -------------------------------------------------------------
@ApiTags('Workshop OS Bookings & Check-In')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantIsolationGuard)
@Controller('workshop/bookings')
export class WorkshopBookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  @ApiOperation({ summary: 'List workshop bookings and scheduled appointments' })
  async listBookings(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryBookingsDto,
  ) {
    return this.bookingsService.listWorkshopBookings(user.workshop_id!, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full booking details and connected job card' })
  async getBookingById(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.bookingsService.getWorkshopBookingById(user.workshop_id!, id);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm appointment booking slot' })
  async confirmBooking(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ConfirmBookingDto,
  ) {
    return this.bookingsService.confirmBooking(
      user.workshop_id!,
      id,
      dto,
      user.sub,
    );
  }

  @Post(':id/check-in')
  @ApiOperation({
    summary:
      'Vehicle Arrival Check-In: Record arrival mileage, condition notes and initialize Job Card',
  })
  async checkInVehicle(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CheckInVehicleDto,
  ) {
    return this.bookingsService.checkInVehicle(
      user.workshop_id!,
      id,
      dto,
      user.sub,
    );
  }

  @Post(':id/no-show')
  @ApiOperation({ summary: 'Mark appointment as client no-show' })
  async markNoShow(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: MarkNoShowDto,
  ) {
    return this.bookingsService.markNoShow(
      user.workshop_id!,
      id,
      dto,
      user.sub,
    );
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel booking before vehicle arrival' })
  async cancelBooking(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingsService.cancelBooking(
      user.workshop_id!,
      id,
      dto,
      user.sub,
    );
  }
}

// -------------------------------------------------------------
// 2. CAR OWNER CONTROLLER
// -------------------------------------------------------------
@ApiTags('Car Owner Bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bookings')
export class CustomerBookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post(':id/accept-proposed-time')
  @ApiOperation({ summary: 'Customer accepts alternative time proposed by workshop' })
  @Roles(Role.CAR_OWNER, Role.SUPER_ADMIN)
  async acceptProposedTime(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: AcceptProposedTimeDto,
  ) {
    return this.bookingsService.acceptProposedTime(user.sub, id, dto);
  }
}

