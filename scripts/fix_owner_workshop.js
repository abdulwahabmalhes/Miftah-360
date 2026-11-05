const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function run() {
  const primaryWorkshopId = '2f0af9cc-127d-4c03-8e3b-bd68b26ae3a0';
  const duplicateWorkshopId = '61ee4a0f-8a4d-4d1a-bb75-4d75d058c228';

  const owner = await prisma.user.findFirst({ where: { email: 'owner@workshop.local' } });
  if (!owner) {
    console.log('Owner not found');
    return;
  }

  console.log(`Setting owner (${owner.id}) primary membership to ${primaryWorkshopId}...`);

  // Ensure owner has an active WORKSHOP_OWNER membership on 2f0af9cc-127d-4c03-8e3b-bd68b26ae3a0
  await prisma.workshopStaff.upsert({
    where: {
      workshopId_userId: {
        workshopId: primaryWorkshopId,
        userId: owner.id,
      },
    },
    update: {
      role: 'WORKSHOP_OWNER',
      status: 'ACTIVE',
    },
    create: {
      workshopId: primaryWorkshopId,
      userId: owner.id,
      role: 'WORKSHOP_OWNER',
      status: 'ACTIVE',
    },
  });

  // Remove the duplicate membership on 61ee so there is zero ambiguity
  await prisma.workshopStaff.deleteMany({
    where: {
      workshopId: duplicateWorkshopId,
      userId: owner.id,
    },
  });

  console.log('✅ Cleaned up memberships. owner@workshop.local is now strictly tied to workshop 2f0af9cc-127d-4c03-8e3b-bd68b26ae3a0');

  // Verify
  const memberships = await prisma.workshopStaff.findMany({
    where: { userId: owner.id },
    include: { workshop: { select: { id: true, legalName: true, displayNameAr: true } } },
  });
  console.log('Current owner memberships:', JSON.stringify(memberships, null, 2));

  await prisma.$disconnect();
}

run().catch(console.error);

