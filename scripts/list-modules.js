require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const modules = await prisma.module.findMany({ orderBy: { code: 'asc' } });
  console.log('--- SYSTEM MODULES ---');
  console.table(modules.map(m => ({ code: m.code, name: m.name, isCore: m.isCore })));

  const workshops = await prisma.workshop.findMany({
    select: {
      id: true,
      nameEn: true,
      nameAr: true,
      entitlements: {
        include: { module: true },
      },
    },
  });

  console.log('\n--- WORKSHOP ENTITLEMENTS ---');
  workshops.forEach(w => {
    console.log(`\nWorkshop: ${w.nameAr} (${w.nameEn}) [ID: ${w.id}]`);
    console.table(w.entitlements.map(e => ({
      module: e.module.code,
      name: e.module.name,
      state: e.state,
      enabledAt: e.enabledAt,
      disabledAt: e.disabledAt,
    })));
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());

