require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  const jobs = await p.job.findMany({
    include: {
      vehicle: {
        include: { brand: true, model: true }
      }
    }
  });
  console.log('Total jobs:', jobs.length);
  for (const j of jobs) {
    console.log(`Job ID: ${j.id} | Workshop: ${j.workshopId} | Vehicle: ${j.vehicle.plateNumber} (${j.vehicle.brand?.name} ${j.vehicle.model?.name}) | Status: ${j.status}`);
  }
  await p.$disconnect();
}

check();

