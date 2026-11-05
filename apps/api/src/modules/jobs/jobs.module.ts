import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { WorkshopJobsController } from './jobs.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuditModule, AuthModule],
  controllers: [WorkshopJobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}

