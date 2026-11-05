const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function run() {
  const w1 = await prisma.workshop.findUnique({
    where: { id: '2f0af9cc-127d-4c03-8e3b-bd68b26ae3a0' },
    include: {
      staff: {
        include: { user: true }
      }
    }
  });

  const w2 = await prisma.workshop.findUnique({
    where: { id: '61ee4a0f-8a4d-4d1a-bb75-4d75d058c228' },
    include: {
      staff: {
        include: { user: true }
      }
    }
  });

  console.log('--- Workshop 1 (where user activated everything in Admin) ---');
  console.log('ID:', w1?.id);
  console.log('Name:', w1?.tradeNameAr, '/', w1?.legalName);
  console.log('Staff:', w1?.staff.map(s => `${s.user.email} (${s.role})`));

  console.log('--- Workshop 2 (where owner@workshop.local is logged into) ---');
  console.log('ID:', w2?.id);
  console.log('Name:', w2?.tradeNameAr, '/', w2?.legalName);
  console.log('Staff:', w2?.staff.map(s => `${s.user.email} (${s.role})`));

  await prisma.$disconnect();
}

run().catch(console.error);

