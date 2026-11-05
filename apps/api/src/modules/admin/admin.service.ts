import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  WorkshopStatus,
  ModuleEntitlementState,
  GrantSource,
  StandardErrorCode,
  Role,
  AdminUpdateWorkshopStatusDto,
  AdminUpdateMarketplaceParticipationDto,
  AdminUpdateModuleEntitlementDto,
  AdminCreateServiceDto,
  AdminUpdateServiceDto,
  AdminCreateBrandDto,
  AdminCreateModelDto,
  InspectionPolicy,
} from '@miftah/contracts';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // -------------------------------------------------------------
  // 1. WORKSHOP QUEUE & LIFECYCLE
  // -------------------------------------------------------------
  async listWorkshops(status?: WorkshopStatus, emirate?: any) {
    return this.prisma.workshop.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(emirate ? { emirate } : {}),
      },
      include: {
        owner: { select: { id: true, fullName: true, email: true, phoneE164: true } },
        entitlements: { include: { module: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getWorkshopDetails(id: string) {
    const workshop = await this.prisma.workshop.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, fullName: true, email: true, phoneE164: true } },
        hours: { orderBy: { weekday: 'asc' } },
        supportedBrands: { include: { brand: true } },
        services: { include: { service: { include: { category: true } } } },
        staff: { include: { user: { select: { id: true, fullName: true, email: true, phoneE164: true } } } },
        entitlements: { include: { module: true } },
      },
    });

    if (!workshop) {
      throw new NotFoundException({
        code: StandardErrorCode.NOT_FOUND,
        message: `Workshop ${id} not found`,
      });
    }

    return workshop;
  }

  async approveWorkshop(id: string, adminUserId: string, correlationId: string) {
    const workshop = await this.getWorkshopDetails(id);

    if (workshop.status !== WorkshopStatus.PENDING_VERIFICATION) {
      throw new BadRequestException({
        code: StandardErrorCode.STATE_TRANSITION_INVALID,
        message: `Cannot approve workshop in status ${workshop.status}. Only PENDING_VERIFICATION workshops can be approved.`,
      });
    }

    const updated = await this.prisma.workshop.update({
      where: { id },
      data: {
        status: WorkshopStatus.ACTIVE,
        verifiedAt: new Date(),
      },
    });

    await this.auditService.record({
      actorUserId: adminUserId,
      actorRole: Role.OPERATIONS_ADMIN,
      tenantId: id,
      entityType: 'Workshop',
      entityId: id,
      action: 'WORKSHOP_APPROVED',
      fromState: workshop.status,
      toState: WorkshopStatus.ACTIVE,
      correlationId,
    });

    return updated;
  }

  async rejectWorkshop(id: string, reason: string, adminUserId: string, correlationId: string) {
    const workshop = await this.getWorkshopDetails(id);

    const updated = await this.prisma.workshop.update({
      where: { id },
      data: { status: WorkshopStatus.REJECTED },
    });

    await this.auditService.record({
      actorUserId: adminUserId,
      actorRole: Role.OPERATIONS_ADMIN,
      tenantId: id,
      entityType: 'Workshop',
      entityId: id,
      action: 'WORKSHOP_REJECTED',
      fromState: workshop.status,
      toState: WorkshopStatus.REJECTED,
      reasonCode: reason,
      correlationId,
    });

    return updated;
  }

  async suspendWorkshop(id: string, reason: string, adminUserId: string, correlationId: string) {
    const workshop = await this.getWorkshopDetails(id);

    if (workshop.status !== WorkshopStatus.ACTIVE) {
      throw new BadRequestException({
        code: StandardErrorCode.STATE_TRANSITION_INVALID,
        message: `Cannot suspend workshop in status ${workshop.status}. Only ACTIVE workshops can be suspended.`,
      });
    }

    const updated = await this.prisma.workshop.update({
      where: { id },
      data: { status: WorkshopStatus.SUSPENDED },
    });

    await this.auditService.record({
      actorUserId: adminUserId,
      actorRole: Role.OPERATIONS_ADMIN,
      tenantId: id,
      entityType: 'Workshop',
      entityId: id,
      action: 'WORKSHOP_SUSPENDED',
      fromState: workshop.status,
      toState: WorkshopStatus.SUSPENDED,
      reasonCode: reason,
      correlationId,
    });

    return updated;
  }

  async reactivateWorkshop(id: string, adminUserId: string, correlationId: string) {
    const workshop = await this.getWorkshopDetails(id);

    if (workshop.status !== WorkshopStatus.SUSPENDED && workshop.status !== WorkshopStatus.INACTIVE) {
      throw new BadRequestException({
        code: StandardErrorCode.STATE_TRANSITION_INVALID,
        message: `Cannot reactivate workshop in status ${workshop.status}.`,
      });
    }

    const updated = await this.prisma.workshop.update({
      where: { id },
      data: { status: WorkshopStatus.ACTIVE },
    });

    await this.auditService.record({
      actorUserId: adminUserId,
      actorRole: Role.OPERATIONS_ADMIN,
      tenantId: id,
      entityType: 'Workshop',
      entityId: id,
      action: 'WORKSHOP_REACTIVATED',
      fromState: workshop.status,
      toState: WorkshopStatus.ACTIVE,
      correlationId,
    });

    return updated;
  }

  async deactivateWorkshop(id: string, reason: string, adminUserId: string, correlationId: string) {
    const workshop = await this.getWorkshopDetails(id);

    const updated = await this.prisma.workshop.update({
      where: { id },
      data: { status: WorkshopStatus.INACTIVE },
    });

    await this.auditService.record({
      actorUserId: adminUserId,
      actorRole: Role.OPERATIONS_ADMIN,
      tenantId: id,
      entityType: 'Workshop',
      entityId: id,
      action: 'WORKSHOP_DEACTIVATED',
      fromState: workshop.status,
      toState: WorkshopStatus.INACTIVE,
      reasonCode: reason,
      correlationId,
    });

    return updated;
  }

  async setMarketplaceParticipation(
    id: string,
    dto: AdminUpdateMarketplaceParticipationDto,
    adminUserId: string,
    correlationId: string,
  ) {
    const workshop = await this.getWorkshopDetails(id);

    const updated = await this.prisma.workshop.update({
      where: { id },
      data: { marketplaceParticipation: dto.marketplaceParticipation },
    });

    await this.auditService.record({
      actorUserId: adminUserId,
      actorRole: Role.OPERATIONS_ADMIN,
      tenantId: id,
      entityType: 'Workshop',
      entityId: id,
      action: 'WORKSHOP_MARKETPLACE_PARTICIPATION_UPDATED',
      fromState: String(workshop.marketplaceParticipation),
      toState: String(dto.marketplaceParticipation),
      reasonCode: dto.reason,
      correlationId,
    });

    return updated;
  }

  // -------------------------------------------------------------
  // 2. MODULE ENTITLEMENTS (Admin Only)
  // -------------------------------------------------------------
  async listModules() {
    return this.prisma.module.findMany({ orderBy: { code: 'asc' } });
  }

  async getWorkshopEntitlements(workshopId: string) {
    await this.getWorkshopDetails(workshopId);
    return this.prisma.workshopModuleEntitlement.findMany({
      where: { workshopId },
      include: { module: true },
    });
  }

  async updateModuleEntitlement(
    workshopId: string,
    moduleCode: string,
    dto: AdminUpdateModuleEntitlementDto,
    adminUserId: string,
    correlationId: string,
  ) {
    await this.getWorkshopDetails(workshopId);

    const moduleRecord = await this.prisma.module.findUnique({
      where: { code: moduleCode },
    });

    if (!moduleRecord) {
      throw new NotFoundException({
        code: StandardErrorCode.NOT_FOUND,
        message: `Module with code ${moduleCode} not found`,
      });
    }

    if (moduleRecord.layer === 'CORE' && dto.state === ModuleEntitlementState.DISABLED) {
      throw new BadRequestException({
        code: StandardErrorCode.FORBIDDEN,
        message: 'The CORE module cannot be disabled for any workshop.',
      });
    }

    const entitlement = await this.prisma.workshopModuleEntitlement.upsert({
      where: {
        workshopId_moduleId: {
          workshopId,
          moduleId: moduleRecord.id,
        },
      },
      update: {
        state: dto.state,
        reason: dto.reason,
        changedByAdminUserId: adminUserId,
        changedAt: new Date(),
      },
      create: {
        workshopId,
        moduleId: moduleRecord.id,
        state: dto.state,
        grantSource: GrantSource.ADMIN,
        reason: dto.reason,
        changedByAdminUserId: adminUserId,
      },
    });

    await this.auditService.record({
      actorUserId: adminUserId,
      actorRole: Role.OPERATIONS_ADMIN,
      tenantId: workshopId,
      entityType: 'WorkshopModuleEntitlement',
      entityId: entitlement.id,
      action: `MODULE_${dto.state}`,
      reasonCode: dto.reason,
      metadata: { moduleCode, state: dto.state },
      correlationId,
    });

    return entitlement;
  }

  // -------------------------------------------------------------
  // 3. MASTER DATA MUTATIONS (Admin Only)
  // -------------------------------------------------------------
  async createService(dto: AdminCreateServiceDto, adminUserId: string, correlationId: string) {
    const existing = await this.prisma.service.findUnique({ where: { code: dto.code } });
    if (existing) {
      throw new BadRequestException({
        code: StandardErrorCode.VALIDATION_ERROR,
        message: `Service with code ${dto.code} already exists`,
      });
    }

    const service = await this.prisma.service.create({
      data: {
        code: dto.code,
        categoryId: dto.categoryId,
        nameEn: dto.nameEn,
        nameAr: dto.nameAr,
        preliminaryQuoteAllowed: dto.preliminaryQuoteAllowed,
        inspectionPolicy: dto.inspectionPolicy,
        active: true,
      },
      include: { category: true },
    });

    await this.auditService.record({
      actorUserId: adminUserId,
      actorRole: Role.OPERATIONS_ADMIN,
      entityType: 'Service',
      entityId: service.id,
      action: 'SERVICE_CREATED',
      correlationId,
    });

    return service;
  }

  async updateService(id: string, dto: AdminUpdateServiceDto, adminUserId: string, correlationId: string) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) {
      throw new NotFoundException(`Service ${id} not found`);
    }

    const updated = await this.prisma.service.update({
      where: { id },
      data: {
        ...(dto.nameEn ? { nameEn: dto.nameEn } : {}),
        ...(dto.nameAr ? { nameAr: dto.nameAr } : {}),
        ...(typeof dto.active === 'boolean' ? { active: dto.active } : {}),
        ...(typeof dto.preliminaryQuoteAllowed === 'boolean' ? { preliminaryQuoteAllowed: dto.preliminaryQuoteAllowed } : {}),
        ...(dto.inspectionPolicy ? { inspectionPolicy: dto.inspectionPolicy } : {}),
      },
      include: { category: true },
    });

    await this.auditService.record({
      actorUserId: adminUserId,
      actorRole: Role.OPERATIONS_ADMIN,
      entityType: 'Service',
      entityId: id,
      action: 'SERVICE_UPDATED',
      correlationId,
    });

    return updated;
  }

  async createBrand(dto: AdminCreateBrandDto, adminUserId: string, correlationId: string) {
    const brand = await this.prisma.vehicleBrand.create({
      data: {
        code: dto.code.toUpperCase(),
        name: dto.name,
        active: true,
      },
    });

    await this.auditService.record({
      actorUserId: adminUserId,
      actorRole: Role.OPERATIONS_ADMIN,
      entityType: 'VehicleBrand',
      entityId: brand.id,
      action: 'BRAND_CREATED',
      correlationId,
    });

    return brand;
  }

  async createModel(brandId: string, dto: AdminCreateModelDto, adminUserId: string, correlationId: string) {
    const model = await this.prisma.vehicleModel.create({
      data: {
        brandId,
        name: dto.name,
        active: true,
      },
    });

    await this.auditService.record({
      actorUserId: adminUserId,
      actorRole: Role.OPERATIONS_ADMIN,
      entityType: 'VehicleModel',
      entityId: model.id,
      action: 'MODEL_CREATED',
      correlationId,
    });

    return model;
  }
}

