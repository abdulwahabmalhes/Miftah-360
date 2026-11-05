import { JobsService } from '../../apps/api/src/modules/jobs/jobs.service';
import {
  JobStatus,
  BookingStatus,
  InvoiceStatus,
  PaymentStatus,
  Prisma,
} from '@prisma/client';

describe('Core Service Journey - Phase D, E & F: Job Card Execution & Atomic Completion (E2E)', () => {
  let jobsService: JobsService;
  let mockPrisma: any;
  let mockAudit: any;

  const workshopId = '61ee4a0f-8a4d-4d1a-bb75-4d75d058c228';
  const customerId = 'cust-user-12345';
  const vehicleId = 'veh-land-cruiser-2023';
  const jobId = 'job-hub-9988';
  const bookingId = 'book-112233';
  const serviceRequestId = 'req-778899';
  const revisionId = 'qrev-1111';
  const techUserId = 'tech-user-4455';

  beforeEach(() => {
    mockAudit = {
      record: jest.fn().mockResolvedValue({ id: 'audit-log-uuid' }),
    };

    mockPrisma = {
      $transaction: jest.fn(async (cb) => cb(mockPrisma)),
      job: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      booking: {
        update: jest.fn(),
      },
      vehicle: {
        update: jest.fn(),
      },
      workshopStaff: {
        findFirst: jest.fn(),
      },
      jobNote: {
        create: jest.fn(),
      },
      invoice: {
        create: jest.fn(),
      },
      payment: {
        create: jest.fn(),
        update: jest.fn(),
      },
      maintenanceRecord: {
        create: jest.fn(),
      },
      maintenanceRecordService: {
        create: jest.fn(),
      },
    };

    jobsService = new JobsService(mockPrisma, mockAudit);
  });

  it('1. Block startWork when Quote is not approved', async () => {
    mockPrisma.job.findFirst.mockResolvedValue({
      id: jobId,
      workshopId,
      status: JobStatus.AWAITING_APPROVAL,
      authorizedQuoteRevisionId: null, // NOT approved
    });

    await expect(
      jobsService.startWork(workshopId, jobId, 'staff-1'),
    ).rejects.toThrow('لا يمكن بدء تنفيذ الصيانة قبل اعتماد وموافقة العميل على عرض السعر');
  });

  it('2. Assign Technician & Start Work when Quote is approved (Job is CONFIRMED)', async () => {
    mockPrisma.job.findFirst.mockResolvedValue({
      id: jobId,
      workshopId,
      bookingId,
      status: JobStatus.CONFIRMED,
      authorizedQuoteRevisionId: revisionId, // Approved!
    });

    mockPrisma.workshopStaff.findFirst.mockResolvedValue({
      id: 'staff-tech-1',
      workshopId,
      userId: techUserId,
      status: 'ACTIVE',
      user: { fullName: 'فني الصيانة راشد' },
    });

    mockPrisma.job.update.mockResolvedValue({
      id: jobId,
      assignedTechnicianUserId: techUserId,
      status: JobStatus.CONFIRMED,
    });

    // 1. Assign Tech
    const assigned = await jobsService.assignTechnician(
      workshopId,
      jobId,
      { technicianUserId: techUserId },
      'owner-1',
    );
    expect(assigned.assignedTechnicianUserId).toBe(techUserId);

    // 2. Start Work
    mockPrisma.job.update.mockResolvedValue({
      id: jobId,
      status: JobStatus.IN_PROGRESS,
    });

    const started = await jobsService.startWork(workshopId, jobId, 'tech-1');
    expect(started.status).toBe(JobStatus.IN_PROGRESS);
    expect(mockPrisma.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: bookingId },
        data: { status: BookingStatus.IN_PROGRESS },
      }),
    );
  });

  it('3. Atomic Job Completion Transaction: Job + Booking + Invoice + Payment + MaintenanceRecord', async () => {
    mockPrisma.job.findFirst.mockResolvedValue({
      id: jobId,
      workshopId,
      bookingId,
      vehicleId,
      status: JobStatus.IN_PROGRESS,
      authorizedQuoteRevisionId: revisionId,
      vehicle: { id: vehicleId, mileage: 25400 },
      serviceRequest: {
        userId: customerId,
        serviceId: 'srv-brakes',
        service: { nameAr: 'صيانة وتغيير فحمات الفرامل' },
      },
      authorizedQuoteRevision: {
        subtotal: new Prisma.Decimal(500),
        discount: new Prisma.Decimal(0),
        tax: new Prisma.Decimal(25),
        total: new Prisma.Decimal(525),
        items: [{ description: 'فحمات فرامل وأجور' }],
      },
      invoice: null,
      maintenanceRecord: null,
    });

    mockPrisma.job.update.mockResolvedValue({
      id: jobId,
      status: JobStatus.COMPLETED,
      finalMileage: 25450,
    });

    mockPrisma.invoice.create.mockResolvedValue({
      id: 'inv-8899',
      jobId,
      invoiceNumber: 'INV-202611-1234',
      status: InvoiceStatus.ISSUED,
      total: new Prisma.Decimal(525),
    });

    mockPrisma.payment.create.mockResolvedValue({
      id: 'pay-7788',
      invoiceId: 'inv-8899',
      status: PaymentStatus.UNPAID,
      amountDue: new Prisma.Decimal(525),
      amountPaid: new Prisma.Decimal(0),
    });

    mockPrisma.maintenanceRecord.create.mockResolvedValue({
      id: 'mrec-1122',
      jobId,
      vehicleId,
      mileage: 25450,
    });

    const completion = await jobsService.completeJobTransaction(
      workshopId,
      jobId,
      { finalMileage: 25450 },
      'owner-1',
    );

    expect(completion.job.status).toBe(JobStatus.COMPLETED);
    expect(completion.invoice.status).toBe(InvoiceStatus.ISSUED);
    expect(completion.payment.status).toBe(PaymentStatus.UNPAID);
    expect(completion.maintenanceRecord.mileage).toBe(25450);

    // Verify booking was closed
    expect(mockPrisma.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: bookingId },
        data: { status: BookingStatus.COMPLETED },
      }),
    );

    // Verify vehicle mileage updated
    expect(mockPrisma.vehicle.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: vehicleId },
        data: { mileage: 25450 },
      }),
    );
  });

  it('4. Idempotency: re-completing an already completed job does not duplicate records', async () => {
    const existingInvoice = { id: 'inv-8899', total: new Prisma.Decimal(525), payment: { id: 'pay-1' } };
    const existingRecord = { id: 'mrec-1122' };

    mockPrisma.job.findFirst.mockResolvedValue({
      id: jobId,
      workshopId,
      status: JobStatus.COMPLETED,
      vehicle: { id: vehicleId, mileage: 25450 },
      serviceRequest: { userId: customerId, service: {} },
      invoice: existingInvoice,
      maintenanceRecord: existingRecord,
    });

    const res = await jobsService.completeJobTransaction(workshopId, jobId, {}, 'owner-1');

    expect(res.isAlreadyCompleted).toBe(true);
    expect(mockPrisma.invoice.create).not.toHaveBeenCalled();
    expect(mockPrisma.payment.create).not.toHaveBeenCalled();
    expect(mockPrisma.maintenanceRecord.create).not.toHaveBeenCalled();
  });

  it('5. Settle Payment for Invoice', async () => {
    mockPrisma.job.findFirst.mockResolvedValue({
      id: jobId,
      workshopId,
      invoice: {
        id: 'inv-8899',
        payment: {
          id: 'pay-7788',
          amountDue: new Prisma.Decimal(525),
          status: PaymentStatus.UNPAID,
        },
      },
    });

    mockPrisma.payment.update.mockResolvedValue({
      id: 'pay-7788',
      status: PaymentStatus.PAID,
      amountPaid: new Prisma.Decimal(525),
    });

    const settled = await jobsService.settlePayment(
      workshopId,
      jobId,
      { amount: 525, notes: 'نقداً عند الاستلام' },
      'cashier-1',
    );

    expect(settled.status).toBe(PaymentStatus.PAID);
    expect(Number(settled.amountPaid)).toBe(525);
  });
});

