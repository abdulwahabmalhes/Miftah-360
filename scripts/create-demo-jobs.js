require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createJobs() {
  const targetWorkshopIds = [
    '61ee4a0f-8a4d-4d1a-bb75-4d75d058c228',
    '2f0af9cc-127d-4c03-8e3b-bd68b26ae3a0',
  ];

  const vehicles = await prisma.vehicle.findMany({ include: { brand: true, model: true } });
  const users = await prisma.user.findMany();
  const services = await prisma.service.findMany();

  const defaultOwner = users[0];
  const defaultService = services[0];

  for (const wsId of targetWorkshopIds) {
    const ws = await prisma.workshop.findUnique({ where: { id: wsId } });
    if (!ws) continue;

    for (let i = 0; i < Math.min(vehicles.length, 2); i++) {
      const veh = vehicles[i];

      // 1. ServiceRequest
      const sr = await prisma.serviceRequest.create({
        data: {
          userId: defaultOwner.id,
          vehicleId: veh.id,
          workshopId: ws.id,
          serviceId: defaultService.id,
          issueSummary: 'صيانة وتغيير فحمات وفلاتر وزيت المحرك',
          preferredDatetime: new Date(),
          emirate: 'DUBAI',
          status: 'ACCEPTED',
        },
      });

      // 2. Booking
      const booking = await prisma.booking.create({
        data: {
          userId: defaultOwner.id,
          serviceRequestId: sr.id,
          workshopId: ws.id,
          requestedStartAt: new Date(),
          confirmedStartAt: new Date(),
          status: 'CONFIRMED',
        },
      });

      // 3. Job
      const job = await prisma.job.create({
        data: {
          bookingId: booking.id,
          serviceRequestId: sr.id,
          workshopId: ws.id,
          vehicleId: veh.id,
          status: 'IN_PROGRESS',
          startedAt: new Date(),
        },
      });

      console.log(`✅ Created Job #${job.id.slice(0, 8)} for Vehicle: ${veh.plateNumber || 'No Plate'} (${veh.brand?.name} ${veh.model?.name}) in Workshop: ${ws.displayNameAr}`);
    }
  }

  await prisma.$disconnect();
}

createJobs().catch(console.error);
