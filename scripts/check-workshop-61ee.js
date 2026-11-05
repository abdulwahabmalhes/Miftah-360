const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function run() {
  const workshop = await prisma.workshop.findUnique({
    where: { id: '61ee4a0f-8a4d-4d1a-bb75-4d75d058c228' },
    include: {
      entitlements: {
        include: {
          module: true,
        },
      },
      services: {
        include: {
          service: true,
        },
      },
    },
  });

  console.log('Workshop legalName:', workshop.legalName);
  console.log('Entitlements enabled count:', workshop.entitlements.filter(e => e.state === 'ENABLED').length);
  for (const e of workshop.entitlements) {
    console.log(`- ${e.module.code} (${e.module.nameAr}): ${e.state}`);
  }

  await prisma.$disconnect();
}

run().catch(console.error);

