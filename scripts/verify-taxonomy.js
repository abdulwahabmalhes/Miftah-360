require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { CANONICAL_SERVICE_TAXONOMY_V1 } = require('../packages/contracts/dist');

const prisma = new PrismaClient();

async function check() {
  const dbServices = await prisma.service.findMany({
    include: { category: true },
    orderBy: { code: 'asc' },
  });

  console.log('Database total services count:', dbServices.length);
  console.log('Contracts total services count:', CANONICAL_SERVICE_TAXONOMY_V1.length);

  const catCounts = {};
  for (const s of dbServices) {
    catCounts[s.category.code] = (catCounts[s.category.code] || 0) + 1;
  }
  console.log('Category breakdown in DB:', catCounts);

  const dbCodes = new Set(dbServices.map((s) => s.code));
  const contractCodes = new Set(CANONICAL_SERVICE_TAXONOMY_V1.map((s) => s.serviceCode));

  const missingInDb = [...contractCodes].filter((c) => !dbCodes.has(c));
  const extraInDb = [...dbCodes].filter((c) => !contractCodes.has(c));

  console.log('Missing in DB:', missingInDb);
  console.log('Extra in DB:', extraInDb);

  await prisma.$disconnect();
}

check().catch((e) => {
  console.error(e);
  process.exit(1);
});
