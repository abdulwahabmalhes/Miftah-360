import { Module } from '@nestjs/common';
import { ServiceRequestsService } from './service-requests.service';
import {
  WorkshopServiceRequestsController,
  CustomerServiceRequestsController,
} from './service-requests.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuditModule, AuthModule],
  controllers: [
    WorkshopServiceRequestsController,
    CustomerServiceRequestsController,
  ],
  providers: [ServiceRequestsService],
  exports: [ServiceRequestsService],
})
export class ServiceRequestsModule {}
