import { Module } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import {
  WorkshopQuotesController,
  CustomerQuotesController,
} from './quotes.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuditModule, AuthModule],
  controllers: [
    WorkshopQuotesController,
    CustomerQuotesController,
  ],
  providers: [QuotesService],
  exports: [QuotesService],
})
export class QuotesModule {}

