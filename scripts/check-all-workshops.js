const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function run() {
  const workshops = await prisma.workshop.findMany({
    include: {
      entitlements: {
        include: {
          module: true,
        },
      },
    },
  });

  console.log(`Total workshops: ${workshops.length}`);
  for (const w of workshops) {
    if (w.entitlements.length > 5) {
      console.log(`Workshop ${w.id} (${w.legalNameEn}): ${w.entitlements.length} entitlements:`);
      for (const e of w.entitlements) {
        console.log(`  ${e.module.code}: ${e.state}`);
      }
    }
  }
  await prisma.$disconnect();
}

run().catch(console.error);

