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
import { JwtPayload } from '@miftah/contracts';
import { JobsService } from './jobs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantIsolationGuard } from '../../common/guards/tenant-isolation.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  AssignTechnicianDto,
  AddJobNoteDto,
  CompleteJobDto,
  RecordPaymentDto,
  QueryJobsDto,
} from './dto/jobs.dto';

@ApiTags('Workshop OS Job Card Hub & Execution')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantIsolationGuard)
@Controller('workshop/jobs')
export class WorkshopJobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  @ApiOperation({ summary: 'List workshop jobs with operational next-action indicators' })
  async listJobs(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryJobsDto,
  ) {
    return this.jobsService.listJobs(user.workshop_id!, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get unified Job Card Hub context with all journey connections' })
  async getJobCard(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.jobsService.getJobCardHubContext(user.workshop_id!, id);
  }

  @Post(':id/assign-technician')
  @ApiOperation({ summary: 'Assign a certified workshop technician to the Job' })
  async assignTechnician(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: AssignTechnicianDto,
  ) {
    return this.jobsService.assignTechnician(
      user.workshop_id!,
      id,
      dto,
      user.sub,
    );
  }

  @Post(':id/start-work')
  @ApiOperation({
    summary:
      'Start physical maintenance work: strictly blocked until Quote is accepted by customer',
  })
  async startWork(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.jobsService.startWork(user.workshop_id!, id, user.sub);
  }

  @Post(':id/notes')
  @ApiOperation({ summary: 'Add operational progress or technician note to Job Card' })
  async addNote(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: AddJobNoteDto,
  ) {
    return this.jobsService.addJobNote(user.workshop_id!, id, dto, user.sub);
  }

  @Post(':id/complete')
  @ApiOperation({
    summary:
      'Atomic Job Completion Transaction: Marks Job & Booking complete, issues Invoice, creates unpaid Payment, and logs MaintenanceRecord',
  })
  async completeJob(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CompleteJobDto,
  ) {
    return this.jobsService.completeJobTransaction(
      user.workshop_id!,
      id,
      dto,
      user.sub,
    );
  }

  @Post(':id/invoice/settle-payment')
  @ApiOperation({ summary: 'Record payment settlement (outside Miftah cash/card) for Job Invoice' })
  async settlePayment(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: RecordPaymentDto,
  ) {
    return this.jobsService.settlePayment(
      user.workshop_id!,
      id,
      dto,
      user.sub,
    );
  }
}

