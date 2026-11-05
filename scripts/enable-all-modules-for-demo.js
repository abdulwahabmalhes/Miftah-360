const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function run() {
  const allModules = await prisma.module.findMany();
  console.log('All modules in DB:', allModules.map(m => `${m.code} (${m.nameAr})`));

  const targetWorkshops = [
    '61ee4a0f-8a4d-4d1a-bb75-4d75d058c228',
    '2f0af9cc-127d-4c03-8e3b-bd68b26ae3a0',
  ];

  for (const workshopId of targetWorkshops) {
    console.log(`\nEnabling all modules for workshop: ${workshopId}`);
    for (const mod of allModules) {
      await prisma.workshopModuleEntitlement.upsert({
        where: {
          workshopId_moduleId: {
            workshopId,
            moduleId: mod.id,
          },
        },
        update: {
          state: 'ENABLED',
        },
        create: {
          workshopId,
          moduleId: mod.id,
          state: 'ENABLED',
          grantSource: 'ADMIN',
        },
      });
      console.log(`  + Enabled ${mod.code}`);
    }
  }

  console.log('\n✅ All modules enabled for both workshops in database!');
  await prisma.$disconnect();
}

run().catch(console.error);

