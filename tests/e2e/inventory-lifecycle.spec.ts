import { InventoryService } from '../../apps/api/src/modules/inventory/inventory.service';
import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('Inventory & Spare Parts Lifecycle (E2E Verification)', () => {
  let inventoryService: InventoryService;
  let mockPrisma: any;
  let mockAudit: any;

  const workshopId = '61ee4a0f-8a4d-4d1a-bb75-4d75d058c228';
  const categoryId = 'cat-brakes-uuid';
  const subcategoryId = 'subcat-pads-uuid';
  const jobId = 'job-order-camry-uuid';

  beforeEach(() => {
    mockAudit = {
      record: jest.fn().mockResolvedValue({ id: 'audit-log-uuid' }),
    };

    mockPrisma = {
      workshopModuleEntitlement: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'entitlement-uuid',
          workshopId,
          state: 'ENABLED',
          module: { code: 'INVENTORY' },
        }),
      },
      inventoryCategory: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      inventorySubcategory: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      inventoryItem: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      inventoryMovement: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      jobPartReservation: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      job: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(mockPrisma)),
    };

    inventoryService = new InventoryService(mockPrisma, mockAudit);
  });

  it('1. REJECTS item creation when subcategory does not belong to category or workshop', async () => {
    mockPrisma.inventorySubcategory.findFirst.mockResolvedValue(null);

    await expect(
      inventoryService.createItem(workshopId, {
        categoryId,
        subcategoryId: 'wrong-subcat-id',
        sku: 'BRK-CAM-01',
        nameAr: 'فحمات فرامل أمامية',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('2. CREATES item with initial stock and atomic INITIAL_STOCK movement', async () => {
    mockPrisma.inventorySubcategory.findFirst.mockResolvedValue({
      id: subcategoryId,
      categoryId,
      workshopId,
    });
    mockPrisma.inventoryItem.findUnique.mockResolvedValue(null);
    mockPrisma.inventoryItem.create.mockResolvedValue({
      id: 'item-uuid-1',
      workshopId,
      categoryId,
      subcategoryId,
      sku: 'BRK-CAM-01',
      nameAr: 'فحمات أمامية لكامري',
      onHandQty: new Prisma.Decimal(10),
      reservedQty: new Prisma.Decimal(0),
      reorderLevel: new Prisma.Decimal(5),
    });

    const item = await inventoryService.createItem(workshopId, {
      categoryId,
      subcategoryId,
      sku: 'BRK-CAM-01',
      nameAr: 'فحمات أمامية لكامري',
      initialQty: 10,
      costPrice: 120,
      sellingPrice: 220,
    });

    expect(item).toBeDefined();
    expect(mockPrisma.inventoryMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          movementType: 'INITIAL_STOCK',
          quantity: new Prisma.Decimal(10),
        }),
      }),
    );
  });

  it('3. STOCK IN: increases physical onHandQty and records STOCK_IN movement', async () => {
    const existingItem = {
      id: 'item-uuid-1',
      workshopId,
      onHandQty: new Prisma.Decimal(10),
      reservedQty: new Prisma.Decimal(3),
      costPrice: new Prisma.Decimal(120),
    };
    mockPrisma.inventoryItem.findFirst.mockResolvedValue(existingItem);
    mockPrisma.inventoryItem.update.mockResolvedValue({
      ...existingItem,
      onHandQty: new Prisma.Decimal(15),
    });

    const result = await inventoryService.stockIn(workshopId, 'item-uuid-1', {
      quantity: 5,
      unitCost: 115,
      supplierName: 'الفطيم للسيارات',
      supplierInvoiceNo: 'INV-2026-001',
    });

    expect(result.onHandQty).toBe(15);
    expect(result.availableQty).toBe(12); // 15 on hand - 3 reserved = 12
    expect(mockPrisma.inventoryMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          movementType: 'STOCK_IN',
          quantity: new Prisma.Decimal(5),
        }),
      }),
    );
  });

  it('4. RESERVE FOR JOB: leaves On-Hand unchanged, increases Reserved, decreases Available', async () => {
    mockPrisma.job.findFirst.mockResolvedValue({
      id: jobId,
      workshopId,
      vehicle: { plateNumber: 'A 12345' },
    });
    const item = {
      id: 'item-uuid-1',
      workshopId,
      onHandQty: new Prisma.Decimal(10),
      reservedQty: new Prisma.Decimal(0),
      sellingPrice: new Prisma.Decimal(220),
    };
    mockPrisma.inventoryItem.findFirst.mockResolvedValue(item);
    mockPrisma.inventoryItem.update.mockResolvedValue({
      ...item,
      reservedQty: new Prisma.Decimal(3),
    });
    mockPrisma.jobPartReservation.create.mockResolvedValue({
      id: 'res-uuid-1',
      jobId,
      itemId: item.id,
      requestedQty: new Prisma.Decimal(3),
      reservedQty: new Prisma.Decimal(3),
      shortageQty: new Prisma.Decimal(0),
    });

    const result = await inventoryService.reserveForJob(workshopId, item.id, {
      jobId,
      quantity: 3,
      unitPrice: 220,
    });

    expect(result.requestedQty).toBe(3);
    expect(result.reservedNow).toBe(3);
    expect(result.shortage).toBe(0);
    expect(result.onHandQty).toBe(10); // Physical stock remains 10
    expect(result.reservedQty).toBe(3);
    expect(result.availableQty).toBe(7); // 10 - 3 = 7
  });

  it('5. DISPENSE TO TECHNICIAN: consumes from reserved and reduces physical onHand', async () => {
    const reservation = {
      id: 'res-uuid-1',
      workshopId,
      jobId,
      itemId: 'item-uuid-1',
      requestedQty: new Prisma.Decimal(3),
      reservedQty: new Prisma.Decimal(3),
      dispensedQty: new Prisma.Decimal(0),
      status: 'RESERVED',
      unitPrice: new Prisma.Decimal(220),
      item: {
        id: 'item-uuid-1',
        onHandQty: new Prisma.Decimal(10),
        reservedQty: new Prisma.Decimal(3),
      },
      job: { vehicle: { plateNumber: 'A 12345' } },
    };
    mockPrisma.jobPartReservation.findFirst.mockResolvedValue(reservation);

    const result = await inventoryService.dispenseToTechnician(workshopId, 'res-uuid-1', {
      quantity: 2,
      technicianName: 'فني الميكانيكا أحمد',
    });

    expect(result.onHandQty).toBe(8); // 10 on hand - 2 dispensed = 8
    expect(result.reservedQty).toBe(1); // 3 reserved - 2 dispensed = 1
    expect(result.availableQty).toBe(7); // 8 - 1 = 7
    expect(mockPrisma.inventoryMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          movementType: 'JOB_DISPENSE',
          quantity: new Prisma.Decimal(2),
        }),
      }),
    );
  });

  it('6. RELEASE RESERVATION: unreserves unissued quantity back to available pool', async () => {
    const reservation = {
      id: 'res-uuid-1',
      workshopId,
      jobId,
      itemId: 'item-uuid-1',
      requestedQty: new Prisma.Decimal(3),
      reservedQty: new Prisma.Decimal(3),
      dispensedQty: new Prisma.Decimal(2),
      status: 'PARTIALLY_DISPENSED',
      item: {
        id: 'item-uuid-1',
        onHandQty: new Prisma.Decimal(8),
        reservedQty: new Prisma.Decimal(1),
      },
    };
    mockPrisma.jobPartReservation.findFirst.mockResolvedValue(reservation);

    const result = await inventoryService.releaseReservation(workshopId, 'res-uuid-1', {
      notes: 'العميل تراجع عن استبدال القطعة المتبقية',
    });

    expect(result.releasedQty).toBe(1);
    expect(result.availableQty).toBe(8); // 8 on hand - 0 reserved = 8
    expect(mockPrisma.inventoryMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          movementType: 'RESERVATION_RELEASE',
          quantity: new Prisma.Decimal(1),
        }),
      }),
    );
  });

  it('7. RETURN FROM JOB: good part returns to stock, defective part logged outside stock', async () => {
    // 7a. Good Return
    const resGood = {
      id: 'res-uuid-1',
      workshopId,
      jobId,
      itemId: 'item-uuid-1',
      dispensedQty: new Prisma.Decimal(2),
      returnedQty: new Prisma.Decimal(0),
      unitPrice: new Prisma.Decimal(220),
      item: {
        id: 'item-uuid-1',
        onHandQty: new Prisma.Decimal(8),
        reservedQty: new Prisma.Decimal(0),
      },
    };
    mockPrisma.jobPartReservation.findFirst.mockResolvedValue(resGood);

    const resultGood = await inventoryService.returnFromJob(workshopId, 'res-uuid-1', {
      quantity: 1,
      isDefective: false,
    });

    expect(resultGood.onHandQty).toBe(9); // 8 + 1 = 9
    expect(resultGood.availableQty).toBe(9);
    expect(mockPrisma.inventoryMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          movementType: 'JOB_RETURN_GOOD',
          quantity: new Prisma.Decimal(1),
        }),
      }),
    );

    // 7b. Defective Return
    const resDefective = {
      id: 'res-uuid-2',
      workshopId,
      jobId,
      itemId: 'item-uuid-1',
      dispensedQty: new Prisma.Decimal(2),
      returnedQty: new Prisma.Decimal(0),
      unitPrice: new Prisma.Decimal(220),
      item: {
        id: 'item-uuid-1',
        onHandQty: new Prisma.Decimal(8),
        reservedQty: new Prisma.Decimal(0),
      },
    };
    mockPrisma.jobPartReservation.findFirst.mockResolvedValue(resDefective);

    const resultDefective = await inventoryService.returnFromJob(workshopId, 'res-uuid-2', {
      quantity: 1,
      isDefective: true,
      defectReason: 'كسر في العازل',
    });

    expect(resultDefective.onHandQty).toBe(8); // On hand does NOT increase for defective/scrap
    expect(mockPrisma.inventoryMovement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          movementType: 'JOB_RETURN_DEFECTIVE',
          quantity: new Prisma.Decimal(1),
        }),
      }),
    );
  });

  it('8. CYCLE COUNT RECONCILIATION: blocks reconciliation when counted < reserved', async () => {
    const itemWithReservations = {
      id: 'item-uuid-1',
      workshopId,
      onHandQty: new Prisma.Decimal(10),
      reservedQty: new Prisma.Decimal(4),
    };
    mockPrisma.inventoryItem.findFirst.mockResolvedValue(itemWithReservations);

    // Counted 2, but reserved is 4 -> must throw BadRequestException
    await expect(
      inventoryService.reconcileStock(workshopId, 'item-uuid-1', {
        countedQty: 2,
        reason: 'جرد دوري',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});

