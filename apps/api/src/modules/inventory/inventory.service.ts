import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateSubcategoryDto,
  UpdateSubcategoryDto,
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
  StockInDto,
  ReserveForJobDto,
  DispenseToTechnicianDto,
  ReleaseReservationDto,
  ReturnFromJobDto,
  ReconciliationDto,
} from './dto/inventory.dto';
import {
  StockMovementType,
  JobReservationStatus,
  InventoryItemStatus,
  Prisma,
} from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // -------------------------------------------------------------
  // ENTITLEMENT CHECK
  // -------------------------------------------------------------
  async checkInventoryModuleEntitled(workshopId: string): Promise<boolean> {
    const entitlement = await this.prisma.workshopModuleEntitlement.findFirst({
      where: {
        workshopId,
        module: { code: 'INVENTORY' },
        state: 'ENABLED',
      },
    });

    if (!entitlement) {
      throw new ForbiddenException({
        code: 'MODULE_DISABLED',
        message:
          'موديول إدارة المخزون وقطع الغيار غير مفعّل لهذه الورشة من قبل إدارة منصة مفتاح 360',
      });
    }

    return true;
  }

  // -------------------------------------------------------------
  // CATEGORIES & SUBCATEGORIES
  // -------------------------------------------------------------
  async getCategories(workshopId: string) {
    await this.checkInventoryModuleEntitled(workshopId);

    return this.prisma.inventoryCategory.findMany({
      where: { workshopId, isArchived: false },
      include: {
        subcategories: {
          where: { isArchived: false },
          orderBy: { sortOrder: 'asc' },
          include: {
            _count: { select: { items: true } },
          },
        },
        _count: { select: { items: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createCategory(workshopId: string, dto: CreateCategoryDto) {
    await this.checkInventoryModuleEntitled(workshopId);

    const existing = await this.prisma.inventoryCategory.findFirst({
      where: { workshopId, nameAr: dto.nameAr.trim() },
    });
    if (existing) {
      if (existing.isArchived) {
        // Unarchive
        return this.prisma.inventoryCategory.update({
          where: { id: existing.id },
          data: { isArchived: false, nameEn: dto.nameEn, icon: dto.icon },
        });
      }
      throw new ConflictException('التصنيف الرئيسي موجود مسبقاً بنفس الاسم');
    }

    return this.prisma.inventoryCategory.create({
      data: {
        workshopId,
        nameAr: dto.nameAr.trim(),
        nameEn: dto.nameEn?.trim(),
        icon: dto.icon || 'folder',
        sortOrder: dto.sortOrder || 0,
      },
      include: { subcategories: true },
    });
  }

  async updateCategory(workshopId: string, categoryId: string, dto: UpdateCategoryDto) {
    await this.checkInventoryModuleEntitled(workshopId);

    const category = await this.prisma.inventoryCategory.findFirst({
      where: { id: categoryId, workshopId },
    });
    if (!category) throw new NotFoundException('التصنيف الرئيسي غير موجود');

    return this.prisma.inventoryCategory.update({
      where: { id: categoryId },
      data: {
        ...(dto.nameAr ? { nameAr: dto.nameAr.trim() } : {}),
        ...(dto.nameEn !== undefined ? { nameEn: dto.nameEn?.trim() } : {}),
        ...(dto.icon !== undefined ? { icon: dto.icon } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.isArchived !== undefined ? { isArchived: dto.isArchived } : {}),
      },
    });
  }

  async createSubcategory(workshopId: string, dto: CreateSubcategoryDto) {
    await this.checkInventoryModuleEntitled(workshopId);

    const parentCat = await this.prisma.inventoryCategory.findFirst({
      where: { id: dto.categoryId, workshopId, isArchived: false },
    });
    if (!parentCat) {
      throw new BadRequestException('التصنيف الرئيسي المحدد غير صالح أو غير تابع للورشة');
    }

    const existing = await this.prisma.inventorySubcategory.findFirst({
      where: {
        workshopId,
        categoryId: dto.categoryId,
        nameAr: dto.nameAr.trim(),
      },
    });
    if (existing) {
      if (existing.isArchived) {
        return this.prisma.inventorySubcategory.update({
          where: { id: existing.id },
          data: { isArchived: false, nameEn: dto.nameEn },
        });
      }
      throw new ConflictException('الفئة الفرعية موجودة مسبقاً ضمن هذا التصنيف');
    }

    return this.prisma.inventorySubcategory.create({
      data: {
        workshopId,
        categoryId: dto.categoryId,
        nameAr: dto.nameAr.trim(),
        nameEn: dto.nameEn?.trim(),
        sortOrder: dto.sortOrder || 0,
      },
    });
  }

  async updateSubcategory(workshopId: string, subcategoryId: string, dto: UpdateSubcategoryDto) {
    await this.checkInventoryModuleEntitled(workshopId);

    const subcategory = await this.prisma.inventorySubcategory.findFirst({
      where: { id: subcategoryId, workshopId },
    });
    if (!subcategory) throw new NotFoundException('الفئة الفرعية غير موجودة');

    return this.prisma.inventorySubcategory.update({
      where: { id: subcategoryId },
      data: {
        ...(dto.nameAr ? { nameAr: dto.nameAr.trim() } : {}),
        ...(dto.nameEn !== undefined ? { nameEn: dto.nameEn?.trim() } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.isArchived !== undefined ? { isArchived: dto.isArchived } : {}),
      },
    });
  }

  // -------------------------------------------------------------
  // ITEMS / PARTS CATALOG
  // -------------------------------------------------------------
  async getItems(
    workshopId: string,
    params: {
      search?: string;
      categoryId?: string;
      subcategoryId?: string;
      lowStockOnly?: boolean;
      status?: InventoryItemStatus;
    },
  ) {
    await this.checkInventoryModuleEntitled(workshopId);

    const where: Prisma.InventoryItemWhereInput = {
      workshopId,
      ...(params.status ? { status: params.status } : {}),
      ...(params.categoryId ? { categoryId: params.categoryId } : {}),
      ...(params.subcategoryId ? { subcategoryId: params.subcategoryId } : {}),
    };

    if (params.search) {
      const q = params.search.trim();
      where.OR = [
        { nameAr: { contains: q, mode: 'insensitive' } },
        { nameEn: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
        { oemPartNumber: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
      ];
    }

    const items = await this.prisma.inventoryItem.findMany({
      where,
      include: {
        category: { select: { id: true, nameAr: true, nameEn: true, icon: true } },
        subcategory: { select: { id: true, nameAr: true, nameEn: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const enriched = items.map((item) => {
      const onHand = Number(item.onHandQty);
      const reserved = Number(item.reservedQty);
      const available = Math.max(0, onHand - reserved);
      const isLowStock = available <= Number(item.reorderLevel);

      return {
        ...item,
        onHandQty: onHand,
        reservedQty: reserved,
        availableQty: available,
        reorderLevel: Number(item.reorderLevel),
        costPrice: Number(item.costPrice),
        sellingPrice: Number(item.sellingPrice),
        isLowStock,
      };
    });

    if (params.lowStockOnly) {
      return enriched.filter((i) => i.isLowStock);
    }

    return enriched;
  }

  async getItemById(workshopId: string, itemId: string) {
    await this.checkInventoryModuleEntitled(workshopId);

    const item = await this.prisma.inventoryItem.findFirst({
      where: { id: itemId, workshopId },
      include: {
        category: true,
        subcategory: true,
        movements: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { actorUser: { select: { id: true, fullName: true } } },
        },
        reservations: {
          where: { status: { not: JobReservationStatus.CANCELLED_RELEASED } },
          include: {
            job: {
              select: {
                id: true,
                status: true,
                vehicle: {
                  select: {
                    plateNumber: true,
                    brand: { select: { name: true } },
                    model: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!item) throw new NotFoundException('القطعة غير موجودة في سجلات الورشة');

    const onHand = Number(item.onHandQty);
    const reserved = Number(item.reservedQty);
    const available = Math.max(0, onHand - reserved);

    return {
      ...item,
      onHandQty: onHand,
      reservedQty: reserved,
      availableQty: available,
      reorderLevel: Number(item.reorderLevel),
      costPrice: Number(item.costPrice),
      sellingPrice: Number(item.sellingPrice),
      isLowStock: available <= Number(item.reorderLevel),
    };
  }

  async createItem(workshopId: string, dto: CreateInventoryItemDto, actorUserId?: string) {
    await this.checkInventoryModuleEntitled(workshopId);

    // 1. Mandatory Category & Subcategory Validation
    if (!dto.categoryId || !dto.subcategoryId) {
      throw new BadRequestException('التصنيف الرئيسي والفئة الفرعية إلزاميان لكل قطعة مخزنية');
    }

    const subcat = await this.prisma.inventorySubcategory.findFirst({
      where: {
        id: dto.subcategoryId,
        categoryId: dto.categoryId,
        workshopId,
        isArchived: false,
      },
    });

    if (!subcat) {
      throw new BadRequestException(
        'الفئة الفرعية لا تنتمي إلى التصنيف الرئيسي المحدد أو غير تابعة للورشة',
      );
    }

    // 2. SKU uniqueness within workshop
    const existingSku = await this.prisma.inventoryItem.findUnique({
      where: { workshopId_sku: { workshopId, sku: dto.sku.trim().toUpperCase() } },
    });
    if (existingSku) {
      throw new ConflictException(`رمز القطعة (SKU) "${dto.sku}" مستخدم بالفعل في هذه الورشة`);
    }

    const initialQty = Math.max(0, Number(dto.initialQty || 0));

    // 3. Create Item & optional initial stock movement atomically
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.create({
        data: {
          workshopId,
          categoryId: dto.categoryId,
          subcategoryId: dto.subcategoryId,
          sku: dto.sku.trim().toUpperCase(),
          oemPartNumber: dto.oemPartNumber?.trim() || null,
          nameAr: dto.nameAr.trim(),
          nameEn: dto.nameEn?.trim() || null,
          brand: dto.brand?.trim() || null,
          qualityTier: dto.qualityTier || 'OEM',
          unit: dto.unit || 'قطعة',
          onHandQty: new Prisma.Decimal(initialQty),
          reservedQty: new Prisma.Decimal(0),
          reorderLevel: new Prisma.Decimal(dto.reorderLevel ?? 5),
          costPrice: new Prisma.Decimal(dto.costPrice || 0),
          sellingPrice: new Prisma.Decimal(dto.sellingPrice || 0),
          location: dto.location || null,
          compatibleVehicles: dto.compatibleVehicles || null,
          descriptionAr: dto.descriptionAr || null,
          supplierName: dto.supplierName || null,
          warrantyMonths: dto.warrantyMonths || null,
        },
        include: { category: true, subcategory: true },
      });

      if (initialQty > 0) {
        await tx.inventoryMovement.create({
          data: {
            workshopId,
            itemId: item.id,
            movementType: StockMovementType.INITIAL_STOCK,
            quantity: new Prisma.Decimal(initialQty),
            previousOnHand: new Prisma.Decimal(0),
            newOnHand: new Prisma.Decimal(initialQty),
            previousReserved: new Prisma.Decimal(0),
            newReserved: new Prisma.Decimal(0),
            unitCost: new Prisma.Decimal(dto.costPrice || 0),
            unitPrice: new Prisma.Decimal(dto.sellingPrice || 0),
            referenceType: 'INITIAL',
            referenceId: 'OPENING_BALANCE',
            notes: 'رصيد افتتاحي عند إدخال القطعة لأول مرة',
            actorUserId: actorUserId || null,
          },
        });
      }

      return item;
    });
  }

  async updateItem(workshopId: string, itemId: string, dto: UpdateInventoryItemDto) {
    await this.checkInventoryModuleEntitled(workshopId);

    const existing = await this.prisma.inventoryItem.findFirst({
      where: { id: itemId, workshopId },
    });
    if (!existing) throw new NotFoundException('القطعة غير موجودة');

    return this.prisma.inventoryItem.update({
      where: { id: itemId },
      data: {
        ...(dto.nameAr ? { nameAr: dto.nameAr.trim() } : {}),
        ...(dto.nameEn !== undefined ? { nameEn: dto.nameEn?.trim() } : {}),
        ...(dto.oemPartNumber !== undefined ? { oemPartNumber: dto.oemPartNumber?.trim() } : {}),
        ...(dto.brand !== undefined ? { brand: dto.brand?.trim() } : {}),
        ...(dto.qualityTier ? { qualityTier: dto.qualityTier } : {}),
        ...(dto.reorderLevel !== undefined ? { reorderLevel: new Prisma.Decimal(dto.reorderLevel) } : {}),
        ...(dto.costPrice !== undefined ? { costPrice: new Prisma.Decimal(dto.costPrice) } : {}),
        ...(dto.sellingPrice !== undefined ? { sellingPrice: new Prisma.Decimal(dto.sellingPrice) } : {}),
        ...(dto.location !== undefined ? { location: dto.location } : {}),
        ...(dto.compatibleVehicles !== undefined ? { compatibleVehicles: dto.compatibleVehicles } : {}),
        ...(dto.descriptionAr !== undefined ? { descriptionAr: dto.descriptionAr } : {}),
        ...(dto.supplierName !== undefined ? { supplierName: dto.supplierName } : {}),
        ...(dto.warrantyMonths !== undefined ? { warrantyMonths: dto.warrantyMonths } : {}),
        ...(dto.status ? { status: dto.status } : {}),
      },
    });
  }

  // -------------------------------------------------------------
  // OPERATIONAL LIFECYCLE 1: STOCK IN (استلام قطع)
  // -------------------------------------------------------------
  async stockIn(workshopId: string, itemId: string, dto: StockInDto, actorUserId?: string) {
    await this.checkInventoryModuleEntitled(workshopId);

    if (dto.quantity <= 0) {
      throw new BadRequestException('يجب أن تكون كمية التوريد أكبر من صفر');
    }

    return this.prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findFirst({
        where: { id: itemId, workshopId },
      });
      if (!item) throw new NotFoundException('القطعة غير موجودة');

      const prevOnHand = Number(item.onHandQty);
      const newOnHand = prevOnHand + Number(dto.quantity);
      const prevReserved = Number(item.reservedQty);

      const updatedItem = await tx.inventoryItem.update({
        where: { id: itemId },
        data: {
          onHandQty: new Prisma.Decimal(newOnHand),
          ...(dto.unitCost ? { costPrice: new Prisma.Decimal(dto.unitCost) } : {}),
          ...(dto.supplierName ? { supplierName: dto.supplierName } : {}),
          status: InventoryItemStatus.ACTIVE,
        },
      });

      const movement = await tx.inventoryMovement.create({
        data: {
          workshopId,
          itemId,
          movementType: StockMovementType.STOCK_IN,
          quantity: new Prisma.Decimal(dto.quantity),
          previousOnHand: new Prisma.Decimal(prevOnHand),
          newOnHand: new Prisma.Decimal(newOnHand),
          previousReserved: new Prisma.Decimal(prevReserved),
          newReserved: new Prisma.Decimal(prevReserved),
          unitCost: dto.unitCost ? new Prisma.Decimal(dto.unitCost) : item.costPrice,
          referenceType: 'SUPPLIER_INVOICE',
          referenceId: dto.supplierInvoiceNo || 'DIRECT_RECEIPT',
          notes: dto.notes || (dto.supplierName ? `توريد من المورد: ${dto.supplierName}` : 'استلام توريد'),
          actorUserId: actorUserId || null,
        },
      });

      return {
        item: updatedItem,
        movement,
        onHandQty: newOnHand,
        availableQty: Math.max(0, newOnHand - prevReserved),
      };
    });
  }

  // -------------------------------------------------------------
  // OPERATIONAL LIFECYCLE 2: RESERVE FOR JOB (حجز لأمر صيانة)
  // -------------------------------------------------------------
  async reserveForJob(
    workshopId: string,
    itemId: string,
    dto: ReserveForJobDto,
    actorUserId?: string,
  ) {
    await this.checkInventoryModuleEntitled(workshopId);

    if (dto.quantity <= 0) {
      throw new BadRequestException('كمية الحجز المطلوبة يجب أن تكون موجبة');
    }

    const job = await this.prisma.job.findFirst({
      where: { id: dto.jobId, workshopId },
      include: { vehicle: true },
    });
    if (!job) throw new NotFoundException('أمر الصيانة غير موجود في سجلات هذه الورشة');

    return this.prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findFirst({
        where: { id: itemId, workshopId },
      });
      if (!item) throw new NotFoundException('القطعة غير موجودة');

      const onHand = Number(item.onHandQty);
      const prevReserved = Number(item.reservedQty);
      const available = Math.max(0, onHand - prevReserved);

      const requestedQty = Number(dto.quantity);
      let reservedNow = 0;
      let shortage = 0;

      if (available >= requestedQty) {
        reservedNow = requestedQty;
        shortage = 0;
      } else {
        reservedNow = Math.max(0, available);
        shortage = requestedQty - reservedNow;
      }

      if (reservedNow === 0 && shortage > 0) {
        // Can't reserve anything, entire quantity is shortage
      }

      const newReserved = prevReserved + reservedNow;

      await tx.inventoryItem.update({
        where: { id: itemId },
        data: { reservedQty: new Prisma.Decimal(newReserved) },
      });

      const effectiveUnitPrice = Number(
        dto.unitPrice !== undefined ? dto.unitPrice : (item.sellingPrice ? Number(item.sellingPrice) : 0),
      ) || 0;

      const reservation = await tx.jobPartReservation.create({
        data: {
          workshopId,
          jobId: dto.jobId,
          itemId,
          requestedQty: new Prisma.Decimal(requestedQty),
          reservedQty: new Prisma.Decimal(reservedNow),
          dispensedQty: new Prisma.Decimal(0),
          returnedQty: new Prisma.Decimal(0),
          shortageQty: new Prisma.Decimal(shortage),
          unitPrice: new Prisma.Decimal(effectiveUnitPrice),
          status:
            shortage > 0 && reservedNow === 0
              ? JobReservationStatus.RESERVED
              : JobReservationStatus.RESERVED,
          notes: dto.notes || `حجز لأمر صيانة سيارة ${job.vehicle.plateNumber}`,
          createdById: actorUserId || null,
        },
      });

      if (reservedNow > 0) {
        await tx.inventoryMovement.create({
          data: {
            workshopId,
            itemId,
            movementType: StockMovementType.JOB_RESERVATION,
            quantity: new Prisma.Decimal(reservedNow),
            previousOnHand: new Prisma.Decimal(onHand),
            newOnHand: new Prisma.Decimal(onHand),
            previousReserved: new Prisma.Decimal(prevReserved),
            newReserved: new Prisma.Decimal(newReserved),
            unitPrice: new Prisma.Decimal(effectiveUnitPrice),
            referenceType: 'JOB',
            referenceId: dto.jobId,
            notes: `حجز ${reservedNow} من أصل ${requestedQty} لأمر صيانة #${dto.jobId.slice(0, 8)}`,
            actorUserId: actorUserId || null,
          },
        });
      }

      return {
        reservation,
        requestedQty,
        reservedNow,
        shortage,
        onHandQty: onHand,
        reservedQty: newReserved,
        availableQty: Math.max(0, onHand - newReserved),
      };
    });
  }

  // -------------------------------------------------------------
  // OPERATIONAL LIFECYCLE 3: DISPENSE TO TECHNICIAN (صرف للفني)
  // -------------------------------------------------------------
  async dispenseToTechnician(
    workshopId: string,
    reservationId: string,
    dto: DispenseToTechnicianDto,
    actorUserId?: string,
  ) {
    await this.checkInventoryModuleEntitled(workshopId);

    const qtyToDispense = Number(dto.quantity);
    if (qtyToDispense <= 0) {
      throw new BadRequestException('يجب أن تكون كمية الصرف أكبر من صفر');
    }

    return this.prisma.$transaction(async (tx) => {
      const reservation = await tx.jobPartReservation.findFirst({
        where: { id: reservationId, workshopId },
        include: { item: true, job: { include: { vehicle: true } } },
      });
      if (!reservation) throw new NotFoundException('حجز القطعة غير موجود');

      if (reservation.status === JobReservationStatus.CANCELLED_RELEASED) {
        throw new BadRequestException('هذا الحجز ملغى ولا يمكن الصرف منه');
      }

      const totalReserved = Number(reservation.reservedQty);
      const alreadyDispensed = Number(reservation.dispensedQty);
      const remainingReserved = totalReserved - alreadyDispensed;

      if (qtyToDispense > remainingReserved) {
        throw new BadRequestException(
          `لا يمكن صرف كمية (${qtyToDispense}) أكبر من الكمية المحجوزة المتبقية (${remainingReserved})`,
        );
      }

      const onHand = Number(reservation.item.onHandQty);
      if (qtyToDispense > onHand) {
        throw new BadRequestException(
          `رصيد المستودع الفعلي (${onHand}) لا يكفي لإتمام الصرف (${qtyToDispense})`,
        );
      }

      const newOnHand = onHand - qtyToDispense;
      const prevItemReserved = Number(reservation.item.reservedQty);
      const newItemReserved = Math.max(0, prevItemReserved - qtyToDispense);

      await tx.inventoryItem.update({
        where: { id: reservation.itemId },
        data: {
          onHandQty: new Prisma.Decimal(newOnHand),
          reservedQty: new Prisma.Decimal(newItemReserved),
        },
      });

      const newDispensed = alreadyDispensed + qtyToDispense;
      const isFullyDispensed = newDispensed >= Number(reservation.requestedQty);

      const updatedReservation = await tx.jobPartReservation.update({
        where: { id: reservationId },
        data: {
          dispensedQty: new Prisma.Decimal(newDispensed),
          status: isFullyDispensed
            ? JobReservationStatus.FULLY_DISPENSED
            : JobReservationStatus.PARTIALLY_DISPENSED,
        },
      });

      const movement = await tx.inventoryMovement.create({
        data: {
          workshopId,
          itemId: reservation.itemId,
          movementType: StockMovementType.JOB_DISPENSE,
          quantity: new Prisma.Decimal(qtyToDispense),
          previousOnHand: new Prisma.Decimal(onHand),
          newOnHand: new Prisma.Decimal(newOnHand),
          previousReserved: new Prisma.Decimal(prevItemReserved),
          newReserved: new Prisma.Decimal(newItemReserved),
          unitPrice: reservation.unitPrice,
          referenceType: 'JOB',
          referenceId: reservation.jobId,
          notes:
            dto.notes ||
            `صرف للفني (${dto.technicianName || 'الفني المختص'}) لأمر الصيانة #${reservation.jobId.slice(0, 8)}`,
          actorUserId: actorUserId || null,
        },
      });

      return {
        reservation: updatedReservation,
        movement,
        onHandQty: newOnHand,
        reservedQty: newItemReserved,
        availableQty: Math.max(0, newOnHand - newItemReserved),
      };
    });
  }

  // -------------------------------------------------------------
  // OPERATIONAL LIFECYCLE 4: RELEASE RESERVATION (فك الحجز)
  // -------------------------------------------------------------
  async releaseReservation(
    workshopId: string,
    reservationId: string,
    dto: ReleaseReservationDto,
    actorUserId?: string,
  ) {
    await this.checkInventoryModuleEntitled(workshopId);

    return this.prisma.$transaction(async (tx) => {
      const reservation = await tx.jobPartReservation.findFirst({
        where: { id: reservationId, workshopId },
        include: { item: true },
      });
      if (!reservation) throw new NotFoundException('حجز القطعة غير موجود');

      if (reservation.status === JobReservationStatus.CANCELLED_RELEASED) {
        throw new BadRequestException('الحجز مفكوك وملغى مسبقاً');
      }

      const totalReserved = Number(reservation.reservedQty);
      const dispensed = Number(reservation.dispensedQty);
      const unissuedReserved = Math.max(0, totalReserved - dispensed);

      if (unissuedReserved <= 0) {
        throw new BadRequestException('لا توجد كميات محجوزة غير مصروفة لفك حجزها');
      }

      const onHand = Number(reservation.item.onHandQty);
      const prevReserved = Number(reservation.item.reservedQty);
      const newItemReserved = Math.max(0, prevReserved - unissuedReserved);

      await tx.inventoryItem.update({
        where: { id: reservation.itemId },
        data: { reservedQty: new Prisma.Decimal(newItemReserved) },
      });

      const updatedReservation = await tx.jobPartReservation.update({
        where: { id: reservationId },
        data: {
          reservedQty: new Prisma.Decimal(dispensed),
          status:
            dispensed > 0
              ? JobReservationStatus.PARTIALLY_DISPENSED
              : JobReservationStatus.CANCELLED_RELEASED,
        },
      });

      const movement = await tx.inventoryMovement.create({
        data: {
          workshopId,
          itemId: reservation.itemId,
          movementType: StockMovementType.RESERVATION_RELEASE,
          quantity: new Prisma.Decimal(unissuedReserved),
          previousOnHand: new Prisma.Decimal(onHand),
          newOnHand: new Prisma.Decimal(onHand),
          previousReserved: new Prisma.Decimal(prevReserved),
          newReserved: new Prisma.Decimal(newItemReserved),
          referenceType: 'JOB',
          referenceId: reservation.jobId,
          notes: dto.notes || `فك حجز كمية ${unissuedReserved} غير مصروفة من أمر الصيانة`,
          actorUserId: actorUserId || null,
        },
      });

      return {
        reservation: updatedReservation,
        movement,
        releasedQty: unissuedReserved,
        availableQty: Math.max(0, onHand - newItemReserved),
      };
    });
  }

  // -------------------------------------------------------------
  // OPERATIONAL LIFECYCLE 5: RETURN FROM JOB (إرجاع من أمر الصيانة)
  // -------------------------------------------------------------
  async returnFromJob(
    workshopId: string,
    reservationId: string,
    dto: ReturnFromJobDto,
    actorUserId?: string,
  ) {
    await this.checkInventoryModuleEntitled(workshopId);

    const qtyToReturn = Number(dto.quantity);
    if (qtyToReturn <= 0) {
      throw new BadRequestException('يجب أن تكون كمية الإرجاع أكبر من صفر');
    }

    return this.prisma.$transaction(async (tx) => {
      const reservation = await tx.jobPartReservation.findFirst({
        where: { id: reservationId, workshopId },
        include: { item: true },
      });
      if (!reservation) throw new NotFoundException('حجز القطعة غير موجود');

      const dispensed = Number(reservation.dispensedQty);
      const alreadyReturned = Number(reservation.returnedQty);
      const netDispensed = dispensed - alreadyReturned;

      if (qtyToReturn > netDispensed) {
        throw new BadRequestException(
          `لا يمكن إرجاع كمية (${qtyToReturn}) أكبر من صافي الكمية المصروفة فعلياً (${netDispensed})`,
        );
      }

      const isDefective = Boolean(dto.isDefective);
      const onHand = Number(reservation.item.onHandQty);
      const reserved = Number(reservation.item.reservedQty);

      // If Good -> re-enters physical stock on hand.
      // If Defective -> remains outside available stock (scrapped / defective).
      const newOnHand = isDefective ? onHand : onHand + qtyToReturn;

      if (!isDefective) {
        await tx.inventoryItem.update({
          where: { id: reservation.itemId },
          data: { onHandQty: new Prisma.Decimal(newOnHand) },
        });
      }

      const updatedReservation = await tx.jobPartReservation.update({
        where: { id: reservationId },
        data: {
          returnedQty: new Prisma.Decimal(alreadyReturned + qtyToReturn),
        },
      });

      const movementType = isDefective
        ? StockMovementType.JOB_RETURN_DEFECTIVE
        : StockMovementType.JOB_RETURN_GOOD;

      const movementNotes = isDefective
        ? `إرجاع قطعة تالفة على أمر الصيانة: ${dto.defectReason || 'تلف أثناء العمل'} (خارج الرصيد الصالح)`
        : dto.notes || 'إرجاع قطعة صالحة للمستودع وإعادة قيدها في الرصيد المتاح';

      const movement = await tx.inventoryMovement.create({
        data: {
          workshopId,
          itemId: reservation.itemId,
          movementType,
          quantity: new Prisma.Decimal(qtyToReturn),
          previousOnHand: new Prisma.Decimal(onHand),
          newOnHand: new Prisma.Decimal(newOnHand),
          previousReserved: new Prisma.Decimal(reserved),
          newReserved: new Prisma.Decimal(reserved),
          unitPrice: reservation.unitPrice,
          referenceType: 'JOB',
          referenceId: reservation.jobId,
          notes: movementNotes,
          actorUserId: actorUserId || null,
        },
      });

      return {
        reservation: updatedReservation,
        movement,
        onHandQty: newOnHand,
        availableQty: Math.max(0, newOnHand - reserved),
        isDefective,
      };
    });
  }

  // -------------------------------------------------------------
  // OPERATIONAL LIFECYCLE 6: CYCLE COUNT & RECONCILIATION (جرد وتسوية)
  // -------------------------------------------------------------
  async reconcileStock(
    workshopId: string,
    itemId: string,
    dto: ReconciliationDto,
    actorUserId?: string,
  ) {
    await this.checkInventoryModuleEntitled(workshopId);

    const countedQty = Number(dto.countedQty);
    if (countedQty < 0) {
      throw new BadRequestException('لا يمكن أن تكون الكمية المعدودة سالبة');
    }

    if (!dto.reason || dto.reason.trim().length === 0) {
      throw new BadRequestException('سبب التسوية إلزامي للاعتماد المحاسبي والرقابي');
    }

    return this.prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findFirst({
        where: { id: itemId, workshopId },
      });
      if (!item) throw new NotFoundException('القطعة غير موجودة');

      const onHand = Number(item.onHandQty);
      const reserved = Number(item.reservedQty);

      // Protection: if counted physical is less than already active job reservations
      if (countedQty < reserved) {
        throw new BadRequestException(
          `تعارض في الجرد: الكمية الفعلية المعدودة (${countedQty}) أقل من الكميات المحجوزة حالياً لأوامر الصيانة النشطة (${reserved}). يرجى مراجعة الحجوزات وفك غير اللازم منها قبل اعتماد التسوية.`,
        );
      }

      const difference = countedQty - onHand;

      if (difference === 0) {
        return {
          item,
          message: 'الكمية الفعلية مطابقة تماماً للرصيد الدفتري، لا يلزم إجراء تسوية',
          difference: 0,
          onHandQty: onHand,
          availableQty: Math.max(0, onHand - reserved),
        };
      }

      const updatedItem = await tx.inventoryItem.update({
        where: { id: itemId },
        data: {
          onHandQty: new Prisma.Decimal(countedQty),
          status: countedQty === 0 ? InventoryItemStatus.OUT_OF_STOCK : InventoryItemStatus.ACTIVE,
        },
      });

      const movement = await tx.inventoryMovement.create({
        data: {
          workshopId,
          itemId,
          movementType: StockMovementType.RECONCILIATION_ADJUSTMENT,
          quantity: new Prisma.Decimal(Math.abs(difference)),
          previousOnHand: new Prisma.Decimal(onHand),
          newOnHand: new Prisma.Decimal(countedQty),
          previousReserved: new Prisma.Decimal(reserved),
          newReserved: new Prisma.Decimal(reserved),
          referenceType: 'AUDIT',
          referenceId: 'CYCLE_COUNT',
          notes: `تسوية جرد دوري: فرق (${difference > 0 ? '+' : ''}${difference}) - السبب: ${dto.reason.trim()}`,
          actorUserId: actorUserId || null,
        },
      });

      return {
        item: updatedItem,
        movement,
        difference,
        onHandQty: countedQty,
        availableQty: Math.max(0, countedQty - reserved),
      };
    });
  }

  // -------------------------------------------------------------
  // MOVEMENTS AUDIT LEDGER
  // -------------------------------------------------------------
  async getMovements(
    workshopId: string,
    params: {
      itemId?: string;
      movementType?: StockMovementType;
      jobId?: string;
      limit?: number;
    },
  ) {
    await this.checkInventoryModuleEntitled(workshopId);

    const where: Prisma.InventoryMovementWhereInput = {
      workshopId,
      ...(params.itemId ? { itemId: params.itemId } : {}),
      ...(params.movementType ? { movementType: params.movementType } : {}),
      ...(params.jobId ? { referenceId: params.jobId } : {}),
    };

    const movements = await this.prisma.inventoryMovement.findMany({
      where,
      include: {
        item: {
          select: {
            id: true,
            sku: true,
            nameAr: true,
            unit: true,
            category: { select: { nameAr: true } },
            subcategory: { select: { nameAr: true } },
          },
        },
        actorUser: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(params.limit || 50, 100),
    });

    return movements.map((m) => ({
      ...m,
      quantity: Number(m.quantity),
      previousOnHand: Number(m.previousOnHand),
      newOnHand: Number(m.newOnHand),
      previousReserved: Number(m.previousReserved),
      newReserved: Number(m.newReserved),
      unitCost: m.unitCost ? Number(m.unitCost) : null,
      unitPrice: m.unitPrice ? Number(m.unitPrice) : null,
    }));
  }

  // -------------------------------------------------------------
  // JOB RESERVATIONS & ACTIVE JOBS SELECTOR
  // -------------------------------------------------------------
  async getActiveJobs(workshopId: string) {
    await this.checkInventoryModuleEntitled(workshopId);

    const jobs = await this.prisma.job.findMany({
      where: { workshopId },
      include: {
        vehicle: {
          include: {
            brand: { select: { name: true } },
            model: { select: { name: true } },
          },
        },
        serviceRequest: {
          include: {
            user: { select: { id: true, fullName: true, phoneE164: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 40,
    });

    return jobs.map((j) => {
      const vBrand = j.vehicle?.brand?.name || '';
      const vModel = j.vehicle?.model?.name || '';
      const vYear = j.vehicle?.year || '';
      const vehicleDesc = [vBrand, vModel, vYear].filter(Boolean).join(' ') || 'سيارة معتمدة';

      return {
        id: j.id,
        status: j.status,
        createdAt: j.createdAt,
        customerName: j.serviceRequest?.user?.fullName || 'عميل مسجل بالورشة',
        customerPhone: j.serviceRequest?.user?.phoneE164 || '',
        plateNumber: j.vehicle?.plateNumber || 'بدون لوحة',
        vehicleDescription: vehicleDesc,
        vin: j.vehicle?.vin || '',
      };
    });
  }

  async getJobReservations(workshopId: string, jobId: string) {
    await this.checkInventoryModuleEntitled(workshopId);

    const reservations = await this.prisma.jobPartReservation.findMany({
      where: { workshopId, jobId },
      include: {
        item: {
          include: {
            category: { select: { nameAr: true } },
            subcategory: { select: { nameAr: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return reservations.map((r) => ({
      ...r,
      requestedQty: Number(r.requestedQty),
      reservedQty: Number(r.reservedQty),
      dispensedQty: Number(r.dispensedQty),
      returnedQty: Number(r.returnedQty),
      shortageQty: Number(r.shortageQty),
      unitPrice: Number(r.unitPrice),
      item: {
        ...r.item,
        onHandQty: Number(r.item.onHandQty),
        reservedQty: Number(r.item.reservedQty),
        availableQty: Math.max(0, Number(r.item.onHandQty) - Number(r.item.reservedQty)),
      },
    }));
  }
}
