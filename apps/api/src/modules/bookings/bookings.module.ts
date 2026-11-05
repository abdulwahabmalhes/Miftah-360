import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import {
  WorkshopBookingsController,
  CustomerBookingsController,
} from './bookings.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuditModule, AuthModule],
  controllers: [
    WorkshopBookingsController,
    CustomerBookingsController,
  ],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
