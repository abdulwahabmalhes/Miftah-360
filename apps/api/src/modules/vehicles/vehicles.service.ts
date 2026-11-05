import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  VehicleStatus,
  StandardErrorCode,
  Role,
} from '@miftah/contracts';

@Injectable()
export class VehiclesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // -------------------------------------------------------------
  // LIST USER VEHICLES
  // -------------------------------------------------------------
  async listUserVehicles(userId: string, status: VehicleStatus = VehicleStatus.ACTIVE) {
    return this.prisma.vehicle.findMany({
      where: {
        ownerUserId: userId,
        status,
      },
      include: {
        brand: true,
        model: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // -------------------------------------------------------------
  // CREATE VEHICLE (GARAGE)
  // -------------------------------------------------------------
  async createVehicle(userId: string, dto: CreateVehicleDto, correlationId: string) {
    // Validate required fields per PO-002
    if (!dto.brandId || !dto.modelId || !dto.year || dto.mileage === undefined) {
      throw new BadRequestException({
        code: StandardErrorCode.VALIDATION_ERROR,
        message: 'Brand, Model, Year, and Mileage are mandatory required fields for vehicle registration.',
      });
    }

    // Verify brand and model exist
    const brand = await this.prisma.vehicleBrand.findUnique({ where: { id: dto.brandId } });
    if (!brand || !brand.active) {
      throw new BadRequestException('Selected brand does not exist or is inactive.');
    }

    const model = await this.prisma.vehicleModel.findUnique({ where: { id: dto.modelId } });
    if (!model || model.brandId !== dto.brandId || !model.active) {
      throw new BadRequestException('Selected model does not match the chosen brand or is inactive.');
    }

    const vehicle = await this.prisma.vehicle.create({
      data: {
        ownerUserId: userId,
        brandId: dto.brandId,
        modelId: dto.modelId,
        year: dto.year,
        mileage: dto.mileage,
        trim: dto.trim || null,
        fuelType: dto.fuelType || null,
        transmission: dto.transmission || null,
        vin: dto.vin || null,
        plateNumber: dto.plateNumber || null,
        emirate: dto.emirate || null,
        registrationExpiry: dto.registrationExpiry ? new Date(dto.registrationExpiry) : null,
        insuranceExpiry: dto.insuranceExpiry ? new Date(dto.insuranceExpiry) : null,
        photoFileId: dto.photoFileId || null,
        notes: dto.notes || null,
        status: VehicleStatus.ACTIVE,
      },
      include: {
        brand: true,
        model: true,
      },
    });

    await this.auditService.record({
      actorUserId: userId,
      actorRole: Role.CAR_OWNER,
      entityType: 'Vehicle',
      entityId: vehicle.id,
      action: 'VEHICLE_ADDED',
      correlationId,
    });

    return vehicle;
  }

  // -------------------------------------------------------------
  // GET VEHICLE DETAILS WITH OWNERSHIP CHECK
  // -------------------------------------------------------------
  async getVehicleDetails(vehicleId: string, userId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        brand: true,
        model: true,
      },
    });

    if (!vehicle) {
      throw new NotFoundException({
        code: StandardErrorCode.NOT_FOUND,
        message: `Vehicle ${vehicleId} not found`,
      });
    }

    if (vehicle.ownerUserId !== userId) {
      throw new ForbiddenException({
        code: StandardErrorCode.FORBIDDEN,
        message: 'You do not have permission to access this vehicle',
      });
    }

    return vehicle;
  }

  // -------------------------------------------------------------
  // UPDATE VEHICLE
  // -------------------------------------------------------------
  async updateVehicle(
    vehicleId: string,
    userId: string,
    dto: UpdateVehicleDto,
    correlationId: string,
  ) {
    await this.getVehicleDetails(vehicleId, userId);

    const updated = await this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        ...(dto.brandId ? { brandId: dto.brandId } : {}),
        ...(dto.modelId ? { modelId: dto.modelId } : {}),
        ...(dto.year ? { year: dto.year } : {}),
        ...(dto.mileage !== undefined ? { mileage: dto.mileage } : {}),
        ...(dto.trim !== undefined ? { trim: dto.trim } : {}),
        ...(dto.fuelType !== undefined ? { fuelType: dto.fuelType } : {}),
        ...(dto.transmission !== undefined ? { transmission: dto.transmission } : {}),
        ...(dto.vin !== undefined ? { vin: dto.vin } : {}),
        ...(dto.plateNumber !== undefined ? { plateNumber: dto.plateNumber } : {}),
        ...(dto.emirate !== undefined ? { emirate: dto.emirate } : {}),
        ...(dto.registrationExpiry ? { registrationExpiry: new Date(dto.registrationExpiry) } : {}),
        ...(dto.insuranceExpiry ? { insuranceExpiry: new Date(dto.insuranceExpiry) } : {}),
        ...(dto.photoFileId !== undefined ? { photoFileId: dto.photoFileId } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
      include: {
        brand: true,
        model: true,
      },
    });

    await this.auditService.record({
      actorUserId: userId,
      actorRole: Role.CAR_OWNER,
      entityType: 'Vehicle',
      entityId: vehicleId,
      action: 'VEHICLE_UPDATED',
      correlationId,
    });

    return updated;
  }

  // -------------------------------------------------------------
  // ARCHIVE & UNARCHIVE (Preserves History)
  // -------------------------------------------------------------
  async setVehicleStatus(
    vehicleId: string,
    userId: string,
    status: VehicleStatus,
    correlationId: string,
  ) {
    const vehicle = await this.getVehicleDetails(vehicleId, userId);

    const updated = await this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: { status },
      include: {
        brand: true,
        model: true,
      },
    });

    await this.auditService.record({
      actorUserId: userId,
      actorRole: Role.CAR_OWNER,
      entityType: 'Vehicle',
      entityId: vehicleId,
      action: status === VehicleStatus.ARCHIVED ? 'VEHICLE_ARCHIVED' : 'VEHICLE_UNARCHIVED',
      fromState: vehicle.status,
      toState: status,
      correlationId,
    });

    return updated;
  }

  // -------------------------------------------------------------
  // MAINTENANCE HISTORY & REMINDERS
  // -------------------------------------------------------------
  async getVehicleHistory(vehicleId: string, userId: string) {
    await this.getVehicleDetails(vehicleId, userId);

    return this.prisma.maintenanceRecord.findMany({
      where: { vehicleId },
      include: {
        workshop: { select: { displayNameEn: true, displayNameAr: true, primaryPhone: true } },
        services: { include: { service: true } },
      },
      orderBy: { serviceDate: 'desc' },
    });
  }

  async getVehicleReminders(vehicleId: string, userId: string) {
    const vehicle = await this.getVehicleDetails(vehicleId, userId);

    const reminders = [];
    const now = new Date();

    // Check registration expiry
    if (vehicle.registrationExpiry) {
      const daysLeft = Math.ceil(
        (vehicle.registrationExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      reminders.push({
        type: 'REGISTRATION_RENEWAL',
        titleEn: 'Vehicle Registration Renewal',
        titleAr: 'تجديد ملكية المركبة',
        dueDate: vehicle.registrationExpiry,
        daysRemaining: daysLeft,
        isOverdue: daysLeft < 0,
      });
    }

    // Check insurance expiry
    if (vehicle.insuranceExpiry) {
      const daysLeft = Math.ceil(
        (vehicle.insuranceExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      reminders.push({
        type: 'INSURANCE_RENEWAL',
        titleEn: 'Insurance Renewal',
        titleAr: 'تجديد تأمين المركبة',
        dueDate: vehicle.insuranceExpiry,
        daysRemaining: daysLeft,
        isOverdue: daysLeft < 0,
      });
    }

    // Routine Oil Service reminder based on mileage
    const nextOilMileage = Math.ceil(vehicle.mileage / 10000) * 10000;
    reminders.push({
      type: 'OIL_CHANGE_INTERVAL',
      titleEn: `Periodic Maintenance Service (${nextOilMileage.toLocaleString()} km)`,
      titleAr: `خدمة الصيانة الدورية (${nextOilMileage.toLocaleString()} كم)`,
      targetMileage: nextOilMileage,
      currentMileage: vehicle.mileage,
      kmRemaining: Math.max(0, nextOilMileage - vehicle.mileage),
    });

    return reminders;
  }
}

