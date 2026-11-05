import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  UpdateWorkshopProfileDto,
  UpdateWorkshopHoursDto,
  UpdateWorkshopBrandsDto,
  UpdateWorkshopServiceDto,
  InviteStaffDto,
  UpdateStaffRoleDto,
  WorkshopStaffRole,
  StaffStatus,
  StandardErrorCode,
  Role,
} from '@miftah/contracts';

@Injectable()
export class WorkshopService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // -------------------------------------------------------------
  // WORKSHOP PROFILE & LOCATION
  // -------------------------------------------------------------
  async getMyWorkshop(workshopId: string) {
    const workshop = await this.prisma.workshop.findUnique({
      where: { id: workshopId },
      include: {
        hours: { orderBy: { weekday: 'asc' } },
        supportedBrands: { include: { brand: true } },
        services: { include: { service: { include: { category: true } } } },
        entitlements: { include: { module: true } },
      },
    });

    if (!workshop) {
      throw new NotFoundException({
        code: StandardErrorCode.NOT_FOUND,
        message: 'Workshop not found',
      });
    }

    return workshop;
  }

  async updateMyWorkshop(
    workshopId: string,
    dto: UpdateWorkshopProfileDto,
    userId: string,
    correlationId: string,
  ) {
    const workshop = await this.getMyWorkshop(workshopId);

    const updated = await this.prisma.workshop.update({
      where: { id: workshopId },
      data: {
        ...(dto.legalName ? { legalName: dto.legalName } : {}),
        ...(dto.displayNameEn ? { displayNameEn: dto.displayNameEn } : {}),
        ...(dto.displayNameAr ? { displayNameAr: dto.displayNameAr } : {}),
        ...(dto.emirate ? { emirate: dto.emirate } : {}),
        ...(dto.addressText ? { addressText: dto.addressText } : {}),
        ...(typeof dto.latitude === 'number' ? { latitude: dto.latitude } : {}),
        ...(typeof dto.longitude === 'number' ? { longitude: dto.longitude } : {}),
        ...(dto.primaryPhone ? { primaryPhone: dto.primaryPhone } : {}),
        ...(dto.primaryEmail ? { primaryEmail: dto.primaryEmail } : {}),
        ...(dto.descriptionEn !== undefined ? { descriptionEn: dto.descriptionEn } : {}),
        ...(dto.descriptionAr !== undefined ? { descriptionAr: dto.descriptionAr } : {}),
      },
    });

    await this.auditService.record({
      actorUserId: userId,
      actorRole: Role.WORKSHOP_OWNER,
      tenantId: workshopId,
      entityType: 'Workshop',
      entityId: workshopId,
      action: 'WORKSHOP_PROFILE_UPDATED',
      correlationId,
    });

    return updated;
  }

  // -------------------------------------------------------------
  // WORKING HOURS
  // -------------------------------------------------------------
  async updateWorkingHours(
    workshopId: string,
    dto: UpdateWorkshopHoursDto,
    userId: string,
    correlationId: string,
  ) {
    await this.getMyWorkshop(workshopId);

    const operations = dto.hours.map((item) =>
      this.prisma.workshopHours.upsert({
        where: {
          workshopId_weekday: {
            workshopId,
            weekday: item.weekday,
          },
        },
        update: {
          openTime: item.openTime,
          closeTime: item.closeTime,
          isClosed: item.isClosed,
        },
        create: {
          workshopId,
          weekday: item.weekday,
          openTime: item.openTime,
          closeTime: item.closeTime,
          isClosed: item.isClosed,
        },
      }),
    );

    const results = await this.prisma.$transaction(operations);

    await this.auditService.record({
      actorUserId: userId,
      actorRole: Role.WORKSHOP_OWNER,
      tenantId: workshopId,
      entityType: 'WorkshopHours',
      action: 'WORKSHOP_HOURS_UPDATED',
      correlationId,
    });

    return results;
  }

  // -------------------------------------------------------------
  // SUPPORTED BRANDS
  // -------------------------------------------------------------
  async updateSupportedBrands(
    workshopId: string,
    dto: UpdateWorkshopBrandsDto,
    userId: string,
    correlationId: string,
  ) {
    await this.getMyWorkshop(workshopId);

    await this.prisma.$transaction(async (tx) => {
      // Clear existing workshop brands
      await tx.workshopBrand.deleteMany({ where: { workshopId } });

      if (dto.allBrands) {
        // Insert record indicating all brands
        await tx.workshopBrand.create({
          data: {
            workshopId,
            allBrands: true,
            brandId: null,
          },
        });
      } else if (dto.brandIds && dto.brandIds.length > 0) {
        // Insert explicit supported brands
        for (const brandId of dto.brandIds) {
          await tx.workshopBrand.create({
            data: {
              workshopId,
              allBrands: false,
              brandId,
            },
          });
        }
      }
    });

    await this.auditService.record({
      actorUserId: userId,
      actorRole: Role.WORKSHOP_OWNER,
      tenantId: workshopId,
      entityType: 'WorkshopBrand',
      action: 'WORKSHOP_BRANDS_UPDATED',
      correlationId,
    });

    return this.prisma.workshopBrand.findMany({
      where: { workshopId },
      include: { brand: true },
    });
  }

  // -------------------------------------------------------------
  // SERVICES & STARTING FROM PRICING (From Central Taxonomy Only)
  // -------------------------------------------------------------
  async getWorkshopServices(workshopId: string) {
    const allServices = await this.prisma.service.findMany({
      where: { active: true },
      include: { category: true },
      orderBy: { code: 'asc' },
    });

    const enabledServices = await this.prisma.workshopService.findMany({
      where: { workshopId },
    });

    const enabledMap = new Map(enabledServices.map((s) => [s.serviceId, s]));

    return allServices.map((service) => {
      const config = enabledMap.get(service.id);
      return {
        service,
        enabled: config ? config.enabled : false,
        startingPriceAmount: config ? config.startingPriceAmount : null,
        currency: config ? config.currency : 'AED',
        notes: config ? config.notes : null,
      };
    });
  }

  async updateWorkshopService(
    workshopId: string,
    serviceId: string,
    dto: UpdateWorkshopServiceDto,
    userId: string,
    correlationId: string,
  ) {
    // Verify service exists in canonical taxonomy
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service || !service.active) {
      throw new BadRequestException({
        code: StandardErrorCode.VALIDATION_ERROR,
        message: 'Cannot configure service: not found or inactive in central taxonomy.',
      });
    }

    const config = await this.prisma.workshopService.upsert({
      where: {
        workshopId_serviceId: {
          workshopId,
          serviceId,
        },
      },
      update: {
        enabled: dto.enabled,
        startingPriceAmount: dto.startingPriceAmount,
        currency: dto.currency || 'AED',
        notes: dto.notes,
      },
      create: {
        workshopId,
        serviceId,
        enabled: dto.enabled,
        startingPriceAmount: dto.startingPriceAmount,
        currency: dto.currency || 'AED',
        notes: dto.notes,
      },
      include: { service: true },
    });

    return config;
  }

  // -------------------------------------------------------------
  // STAFF MANAGEMENT (Owner Only - Fixed Roles)
  // -------------------------------------------------------------
  async listStaff(workshopId: string) {
    return this.prisma.workshopStaff.findMany({
      where: { workshopId },
      include: {
        user: { select: { id: true, fullName: true, email: true, phoneE164: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async inviteStaff(
    workshopId: string,
    dto: InviteStaffDto,
    ownerUserId: string,
    correlationId: string,
  ) {
    // Fixed Phase 1 roles check
    const validRoles = [
      WorkshopStaffRole.WORKSHOP_OWNER,
      WorkshopStaffRole.SERVICE_ADVISOR,
      WorkshopStaffRole.RECEPTION,
      WorkshopStaffRole.TECHNICIAN,
    ];

    if (!validRoles.includes(dto.role)) {
      throw new BadRequestException({
        code: StandardErrorCode.VALIDATION_ERROR,
        message: `Invalid role ${dto.role}. Only fixed roles (WORKSHOP_OWNER, SERVICE_ADVISOR, RECEPTION, TECHNICIAN) permitted.`,
      });
    }

    // Find or create user for staff
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          ...(dto.email ? [{ email: dto.email.toLowerCase() }] : []),
          ...(dto.phone ? [{ phoneE164: dto.phone }] : []),
        ],
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          fullName: dto.fullName,
          email: dto.email ? dto.email.toLowerCase() : null,
          phoneE164: dto.phone || null,
          preferredLanguage: 'ar',
          status: 'ACTIVE',
        },
      });
    }

    // Check if membership already exists in this workshop
    const existingMembership = await this.prisma.workshopStaff.findUnique({
      where: {
        workshopId_userId: {
          workshopId,
          userId: user.id,
        },
      },
    });

    if (existingMembership) {
      throw new BadRequestException({
        code: StandardErrorCode.VALIDATION_ERROR,
        message: 'This user is already a staff member in this workshop.',
      });
    }

    const staff = await this.prisma.workshopStaff.create({
      data: {
        workshopId,
        userId: user.id,
        role: dto.role,
        status: StaffStatus.ACTIVE,
        invitedBy: ownerUserId,
      },
      include: { user: true },
    });

    await this.auditService.record({
      actorUserId: ownerUserId,
      actorRole: Role.WORKSHOP_OWNER,
      tenantId: workshopId,
      entityType: 'WorkshopStaff',
      entityId: staff.id,
      action: 'STAFF_INVITED',
      metadata: { role: dto.role },
      correlationId,
    });

    return staff;
  }

  async updateStaffRole(
    workshopId: string,
    membershipId: string,
    dto: UpdateStaffRoleDto,
    ownerUserId: string,
    correlationId: string,
  ) {
    const staff = await this.prisma.workshopStaff.findUnique({
      where: { id: membershipId },
    });

    if (!staff || staff.workshopId !== workshopId) {
      throw new NotFoundException('Staff membership not found in your workshop');
    }

    const updated = await this.prisma.workshopStaff.update({
      where: { id: membershipId },
      data: { role: dto.role },
      include: { user: true },
    });

    await this.auditService.record({
      actorUserId: ownerUserId,
      actorRole: Role.WORKSHOP_OWNER,
      tenantId: workshopId,
      entityType: 'WorkshopStaff',
      entityId: membershipId,
      action: 'STAFF_ROLE_UPDATED',
      fromState: staff.role,
      toState: dto.role,
      correlationId,
    });

    return updated;
  }

  async setStaffStatus(
    workshopId: string,
    membershipId: string,
    status: StaffStatus,
    ownerUserId: string,
    correlationId: string,
  ) {
    const staff = await this.prisma.workshopStaff.findUnique({
      where: { id: membershipId },
    });

    if (!staff || staff.workshopId !== workshopId) {
      throw new NotFoundException('Staff membership not found in your workshop');
    }

    // If disabling staff member, revoke all active sessions immediately
    if (status === StaffStatus.DISABLED) {
      await this.prisma.session.updateMany({
        where: { userId: staff.userId },
        data: { isRevoked: true },
      });
    }

    const updated = await this.prisma.workshopStaff.update({
      where: { id: membershipId },
      data: { status },
      include: { user: true },
    });

    await this.auditService.record({
      actorUserId: ownerUserId,
      actorRole: Role.WORKSHOP_OWNER,
      tenantId: workshopId,
      entityType: 'WorkshopStaff',
      entityId: membershipId,
      action: `STAFF_${status}`,
      fromState: staff.status,
      toState: status,
      correlationId,
    });

    return updated;
  }

  // -------------------------------------------------------------
  // BASIC CUSTOMERS & VEHICLES SCOPE (Current Phase)
  // -------------------------------------------------------------
  async listCustomers(workshopId: string) {
    // Customers associated with service requests or bookings in this workshop
    const requests = await this.prisma.serviceRequest.findMany({
      where: { workshopId },
      select: {
        user: { select: { id: true, fullName: true, email: true, phoneE164: true } },
        vehicle: {
          select: {
            id: true,
            year: true,
            plateNumber: true,
            brand: { select: { name: true } },
            model: { select: { name: true } },
          },
        },
        createdAt: true,
      },
      distinct: ['userId'],
    });

    return requests.map((r) => ({
      customer: r.user,
      lastVehicle: r.vehicle,
      lastInteraction: r.createdAt,
    }));
  }
}

