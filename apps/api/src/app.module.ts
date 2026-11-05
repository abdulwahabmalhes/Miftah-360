import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { MasterDataModule } from './modules/master-data/master-data.module';
import { HealthModule } from './modules/health/health.module';
import { AdminModule } from './modules/admin/admin.module';
import { WorkshopModule } from './modules/workshop/workshop.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { UsersModule } from './modules/users/users.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ServiceRequestsModule } from './modules/service-requests/service-requests.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { InspectionsModule } from './modules/inspections/inspections.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { JobsModule } from './modules/jobs/jobs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    AuditModule,
    AuthModule,
    MasterDataModule,
    HealthModule,
    AdminModule,
    WorkshopModule,
    VehiclesModule,
    UsersModule,
    InventoryModule,
    ServiceRequestsModule,
    BookingsModule,
    InspectionsModule,
    QuotesModule,
    JobsModule,
  ],
})
export class AppModule {}

