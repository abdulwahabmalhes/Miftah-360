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
import { ServiceRequestsService } from './service-requests.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantIsolationGuard } from '../../common/guards/tenant-isolation.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CreateServiceRequestDto,
  AcceptServiceRequestDto,
  RejectServiceRequestDto,
  ProposeTimeDto,
  QueryServiceRequestsDto,
} from './dto/service-requests.dto';

// -------------------------------------------------------------
// 1. WORKSHOP OS CONTROLLER
// -------------------------------------------------------------
@ApiTags('Workshop OS Service Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantIsolationGuard)
@Controller('workshop/service-requests')
export class WorkshopServiceRequestsController {
  constructor(private readonly serviceRequestsService: ServiceRequestsService) {}

  @Get()
  @ApiOperation({ summary: 'List incoming workshop service requests' })
  async listRequests(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryServiceRequestsDto,
  ) {
    return this.serviceRequestsService.listWorkshopRequests(
      user.workshop_id!,
      query,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full service request details by ID' })
  async getRequestById(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.serviceRequestsService.getWorkshopRequestById(
      user.workshop_id!,
      id,
    );
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Accept incoming service request and confirm booking' })
  async acceptRequest(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: AcceptServiceRequestDto,
  ) {
    return this.serviceRequestsService.acceptRequest(
      user.workshop_id!,
      id,
      dto,
      user.sub,
    );
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject service request with explanation reason' })
  async rejectRequest(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: RejectServiceRequestDto,
  ) {
    return this.serviceRequestsService.rejectRequest(
      user.workshop_id!,
      id,
      dto,
      user.sub,
    );
  }

  @Post(':id/propose-time')
  @ApiOperation({ summary: 'Propose an alternative appointment slot to customer' })
  async proposeTime(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ProposeTimeDto,
  ) {
    return this.serviceRequestsService.proposeTime(
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
@ApiTags('Car Owner Service Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('service-requests')
export class CustomerServiceRequestsController {
  constructor(private readonly serviceRequestsService: ServiceRequestsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit direct service request to a specific workshop' })
  @Roles(Role.CAR_OWNER, Role.SUPER_ADMIN)
  async createRequest(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateServiceRequestDto,
  ) {
    return this.serviceRequestsService.createRequest(user.sub, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'List customer own service requests' })
  @Roles(Role.CAR_OWNER, Role.SUPER_ADMIN)
  async listMyRequests(@CurrentUser() user: JwtPayload) {
    return this.serviceRequestsService.listCustomerRequests(user.sub);
  }
}

