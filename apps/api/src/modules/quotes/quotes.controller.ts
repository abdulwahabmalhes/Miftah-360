import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtPayload, Role } from '@miftah/contracts';
import { QuotesService } from './quotes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantIsolationGuard } from '../../common/guards/tenant-isolation.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CreateQuoteRevisionDto,
  RejectQuoteDto,
} from './dto/quotes.dto';

// -------------------------------------------------------------
// 1. WORKSHOP OS CONTROLLER
// -------------------------------------------------------------
@ApiTags('Workshop OS Quotes & Pricing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantIsolationGuard)
@Controller('workshop/quotes')
export class WorkshopQuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Get('jobs/:jobId')
  @ApiOperation({ summary: 'Get quote family and all revision histories for a specific Job' })
  async getJobQuotes(
    @CurrentUser() user: JwtPayload,
    @Param('jobId') jobId: string,
  ) {
    return this.quotesService.getJobQuotes(user.workshop_id!, jobId);
  }

  @Post('jobs/:jobId')
  @ApiOperation({ summary: 'Create or update editable draft quote revision' })
  async createOrUpdateDraft(
    @CurrentUser() user: JwtPayload,
    @Param('jobId') jobId: string,
    @Body() dto: CreateQuoteRevisionDto,
  ) {
    return this.quotesService.createOrUpdateDraft(
      user.workshop_id!,
      jobId,
      dto,
      user.sub,
    );
  }

  @Post('revisions/:id/send')
  @ApiOperation({
    summary:
      'Send quote to customer: locks revision, generates immutable SHA256 hash, and waits for user approval',
  })
  async sendQuote(
    @CurrentUser() user: JwtPayload,
    @Param('id') revisionId: string,
  ) {
    return this.quotesService.sendQuote(user.workshop_id!, revisionId, user.sub);
  }
}

// -------------------------------------------------------------
// 2. CAR OWNER APPROVAL CONTROLLER
// -------------------------------------------------------------
@ApiTags('Car Owner Quote Approval')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('quotes')
export class CustomerQuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post('revisions/:id/accept')
  @ApiOperation({
    summary:
      'Customer Acceptance Gate: Authorizes the Job Card for technician execution and stock reservation',
  })
  @Roles(Role.CAR_OWNER, Role.SUPER_ADMIN)
  async acceptQuote(
    @CurrentUser() user: JwtPayload,
    @Param('id') revisionId: string,
  ) {
    return this.quotesService.acceptQuote(user.sub, revisionId, user.role);
  }

  @Post('revisions/:id/reject')
  @ApiOperation({ summary: 'Customer rejects the quote revision' })
  @Roles(Role.CAR_OWNER, Role.SUPER_ADMIN)
  async rejectQuote(
    @CurrentUser() user: JwtPayload,
    @Param('id') revisionId: string,
    @Body() dto: RejectQuoteDto,
  ) {
    return this.quotesService.rejectQuote(user.sub, revisionId, dto);
  }
}

