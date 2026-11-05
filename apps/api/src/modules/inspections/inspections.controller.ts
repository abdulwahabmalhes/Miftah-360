import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtPayload } from '@miftah/contracts';
import { InspectionsService } from './inspections.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantIsolationGuard } from '../../common/guards/tenant-isolation.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  StartInspectionDto,
  AddInspectionFindingDto,
  CompleteInspectionDto,
} from './dto/inspections.dto';

@ApiTags('Workshop OS Vehicle Inspections')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantIsolationGuard)
@Controller('workshop/inspections')
export class WorkshopInspectionsController {
  constructor(private readonly inspectionsService: InspectionsService) {}

  @Post('jobs/:jobId/start')
  @ApiOperation({ summary: 'Initiate or resume vehicle technical inspection for a Job' })
  async startInspection(
    @CurrentUser() user: JwtPayload,
    @Param('jobId') jobId: string,
    @Body() dto: StartInspectionDto,
  ) {
    return this.inspectionsService.startInspection(
      user.workshop_id!,
      jobId,
      dto,
      user.sub,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inspection report details and all findings' })
  async getInspectionById(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.inspectionsService.getInspectionById(user.workshop_id!, id);
  }

  @Post(':id/findings')
  @ApiOperation({ summary: 'Record a technical observation / finding in inspection' })
  async addFinding(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: AddInspectionFindingDto,
  ) {
    return this.inspectionsService.addFinding(user.workshop_id!, id, dto);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete and sign off vehicle inspection report' })
  async completeInspection(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CompleteInspectionDto,
  ) {
    return this.inspectionsService.completeInspection(
      user.workshop_id!,
      id,
      dto,
      user.sub,
    );
  }
}

