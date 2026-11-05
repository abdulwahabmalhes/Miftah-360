import { InspectionsService } from '../../apps/api/src/modules/inspections/inspections.service';
import { QuotesService } from '../../apps/api/src/modules/quotes/quotes.service';
import {
  InspectionStatus,
  InspectionSeverity,
  QuoteRevisionStatus,
  JobStatus,
  BookingStatus,
  Prisma,
} from '@prisma/client';
import { Role } from '@miftah/contracts';

describe('Core Service Journey - Phase B & C: Inspections & Quotes Approval Gate (E2E)', () => {
  let inspectionsService: InspectionsService;
  let quotesService: QuotesService;
  let mockPrisma: any;
  let mockAudit: any;

  const workshopId = '61ee4a0f-8a4d-4d1a-bb75-4d75d058c228';
  const customerId = 'cust-user-12345';
  const jobId = 'job-hub-9988';
  const bookingId = 'book-112233';
  const serviceRequestId = 'req-778899';
  const inspectionId = 'insp-5544';
  const quoteFamilyId = 'qfam-3322';
  const revisionId = 'qrev-1111';

  beforeEach(() => {
    mockAudit = {
      record: jest.fn().mockResolvedValue({ id: 'audit-log-uuid' }),
    };

    mockPrisma = {
      $transaction: jest.fn(async (cb) => cb(mockPrisma)),
      job: {
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      booking: {
        update: jest.fn(),
      },
      inspection: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      inspectionFinding: {
        create: jest.fn(),
      },
      quoteFamily: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      quoteRevision: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      quoteItem: {
        deleteMany: jest.fn(),
      },
    };

    inspectionsService = new InspectionsService(mockPrisma, mockAudit);
    quotesService = new QuotesService(mockPrisma, mockAudit);
  });

  it('1. Start Inspection -> sets Job and Booking to INSPECTION status', async () => {
    mockPrisma.job.findFirst.mockResolvedValue({
      id: jobId,
      workshopId,
      bookingId,
      booking: { id: bookingId },
    });
    mockPrisma.inspection.findFirst.mockResolvedValue(null);

    mockPrisma.inspection.create.mockResolvedValue({
      id: inspectionId,
      bookingId,
      jobId,
      status: InspectionStatus.IN_PROGRESS,
    });

    const res = await inspectionsService.startInspection(workshopId, jobId, {}, 'tech-1');

    expect(res.status).toBe(InspectionStatus.IN_PROGRESS);
    expect(mockPrisma.job.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: jobId },
        data: { status: JobStatus.INSPECTION },
      }),
    );
    expect(mockPrisma.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: bookingId },
        data: { status: BookingStatus.INSPECTION },
      }),
    );
  });

  it('2. Add findings and complete inspection', async () => {
    mockPrisma.inspection.findFirst.mockResolvedValue({
      id: inspectionId,
      booking: { workshopId },
      status: InspectionStatus.IN_PROGRESS,
      findings: [],
    });

    mockPrisma.inspectionFinding.create.mockResolvedValue({
      id: 'find-1',
      inspectionId,
      title: 'تآكل فحمات الفرامل الأمامية',
      severity: InspectionSeverity.HIGH,
    });

    const finding = await inspectionsService.addFinding(workshopId, inspectionId, {
      title: 'تآكل فحمات الفرامل الأمامية',
      severity: InspectionSeverity.HIGH,
      userVisible: true,
    });
    expect(finding.severity).toBe(InspectionSeverity.HIGH);

    mockPrisma.inspection.update.mockResolvedValue({
      id: inspectionId,
      status: InspectionStatus.COMPLETED,
      findings: [finding],
    });

    const completed = await inspectionsService.completeInspection(
      workshopId,
      inspectionId,
      { summaryUserVisible: 'تم فحص الفرامل ونوصي بتغيير الفحمات فوراً' },
      'tech-1',
    );
    expect(completed.status).toBe(InspectionStatus.COMPLETED);
  });

  it('3. Create Quote Draft -> calculates server-side 5% UAE VAT and Total', async () => {
    mockPrisma.job.findFirst.mockResolvedValue({
      id: jobId,
      workshopId,
      serviceRequestId,
      booking: { userId: customerId, serviceRequest: { id: serviceRequestId } },
    });

    mockPrisma.quoteFamily.findUnique.mockResolvedValue({
      id: quoteFamilyId,
      serviceRequestId,
      workshopId,
      userId: customerId,
      revisions: [],
    });

    mockPrisma.quoteRevision.create.mockImplementation((args: any) => ({
      id: revisionId,
      ...args.data,
    }));

    const draft = await quotesService.createOrUpdateDraft(
      workshopId,
      jobId,
      {
        items: [
          {
            serviceId: 'srv-labor',
            description: 'أجور فحص وتركيب فحمات أمامية',
            quantity: 1,
            unitPrice: 150, // 150 AED
          },
          {
            serviceId: 'srv-parts',
            description: 'طقم فحمات فرامل سيراميك أصلية',
            quantity: 1,
            unitPrice: 350, // 350 AED
          },
        ],
        discount: 0,
      },
      'advisor-1',
    );

    // Subtotal = 150 + 350 = 500 AED
    // Tax = 5% of 500 = 25 AED
    // Total = 525 AED
    expect(Number(draft.subtotal)).toBe(500);
    expect(Number(draft.tax)).toBe(25);
    expect(Number(draft.total)).toBe(525);
    expect(draft.revisionNumber).toBe(1);
    expect(draft.status).toBe(QuoteRevisionStatus.DRAFT);
  });

  it('4. Send Quote -> Locks revision, sets immutable hash, and sets Job to AWAITING_APPROVAL', async () => {
    mockPrisma.quoteRevision.findFirst.mockResolvedValue({
      id: revisionId,
      quoteFamilyId,
      revisionNumber: 1,
      status: QuoteRevisionStatus.DRAFT,
      total: new Prisma.Decimal(525),
      items: [
        { description: 'أجور فحص', quantity: 1, unitPrice: new Prisma.Decimal(150) },
        { description: 'فحمات', quantity: 1, unitPrice: new Prisma.Decimal(350) },
      ],
      quoteFamily: {
        workshopId,
        serviceRequest: {
          booking: { id: bookingId },
        },
      },
    });

    mockPrisma.quoteRevision.update.mockResolvedValue({
      id: revisionId,
      status: QuoteRevisionStatus.SENT,
      immutableHash: 'mock-sha256-hash',
    });

    const sent = await quotesService.sendQuote(workshopId, revisionId, 'advisor-1');
    expect(sent.status).toBe(QuoteRevisionStatus.SENT);

    expect(mockPrisma.job.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { bookingId },
        data: { status: JobStatus.AWAITING_APPROVAL },
      }),
    );
    expect(mockPrisma.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: bookingId },
        data: { status: BookingStatus.QUOTE_SENT },
      }),
    );
  });

  it('5. Security Gate: Workshop staff cannot accept quote on customer behalf', async () => {
    mockPrisma.quoteRevision.findUnique.mockResolvedValue({
      id: revisionId,
      status: QuoteRevisionStatus.SENT,
      quoteFamily: {
        userId: customerId,
        workshopId,
        serviceRequest: { booking: { id: bookingId, job: { id: jobId } } },
      },
    });

    // Attempting acceptance as WORKSHOP_OWNER must be rejected with 403 Forbidden
    await expect(
      quotesService.acceptQuote('owner-id', revisionId, Role.WORKSHOP_OWNER),
    ).rejects.toThrow('غير مسموح لموظفي الورشة بالموافقة على عرض السعر نيابة عن العميل');
  });

  it('6. Customer Acceptance Gate: Car Owner accepts quote -> Job is AUTHORIZED (CONFIRMED)', async () => {
    mockPrisma.quoteRevision.findUnique.mockResolvedValue({
      id: revisionId,
      status: QuoteRevisionStatus.SENT,
      quoteFamily: {
        userId: customerId,
        workshopId,
        serviceRequest: { booking: { id: bookingId, job: { id: jobId } } },
      },
    });

    mockPrisma.quoteRevision.update.mockResolvedValue({
      id: revisionId,
      status: QuoteRevisionStatus.ACCEPTED,
      acceptedByUserId: customerId,
    });

    const accepted = await quotesService.acceptQuote(
      customerId,
      revisionId,
      Role.CAR_OWNER,
    );

    expect(accepted.status).toBe(QuoteRevisionStatus.ACCEPTED);

    // Job is now AUTHORIZED and moved to CONFIRMED with quote revision linked
    expect(mockPrisma.job.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: jobId },
        data: {
          status: JobStatus.CONFIRMED,
          authorizedQuoteRevisionId: revisionId,
        },
      }),
    );

    expect(mockPrisma.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: bookingId },
        data: { status: BookingStatus.QUOTE_APPROVED },
      }),
    );
  });
});

