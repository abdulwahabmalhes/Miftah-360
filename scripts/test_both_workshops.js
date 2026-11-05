const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

async function testWithWorkshop(wsId, wsName) {
  console.log(`\n================ Testing for workshop ${wsName} (${wsId}) ================`);
  // Generate a JWT for this workshop
  const token = jwt.sign(
    {
      sub: '6bc6f9f8-5794-4aa8-8d92-14a582b03368',
      role: 'WORKSHOP_OWNER',
      workshop_id: wsId,
      workshop_staff_role: 'WORKSHOP_OWNER',
      token_version: 0
    },
    process.env.JWT_SECRET || 'dev_secret_miftah_360_replace_in_prod',
    { expiresIn: '1h' }
  );

  // 1. Get active jobs
  const jobsRes = await fetch('http://localhost:3000/api/v1/workshop/inventory/active-jobs', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const jobs = await jobsRes.json();
  console.log(`Active jobs count: ${jobs.length}`, jobs[0] ? `First job: ${jobs[0].id} (${jobs[0].plateNumber})` : 'No jobs');

  // 2. Get items
  const itemsRes = await fetch('http://localhost:3000/api/v1/workshop/inventory/items', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const items = await itemsRes.json();
  console.log(`Inventory items count: ${items.length}`);
  const shock = items.find(i => i.nameAr.includes('مساعد'));
  console.log('Shock absorber item in this workshop:', shock ? `${shock.id} (onHand: ${shock.onHandQty}, reserved: ${shock.reservedQty})` : 'None');

  if (shock && jobs[0]) {
    // 3. Try to reserve!
    const reserveRes = await fetch(`http://localhost:3000/api/v1/workshop/inventory/items/${shock.id}/reserve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        jobId: jobs[0].id,
        quantity: 1,
        unitPrice: 460,
        notes: 'Test reserve from script'
      })
    });
    console.log(`Reserve status: ${reserveRes.status}`);
    const reserveData = await reserveRes.json();
    console.log('Reserve response:', JSON.stringify(reserveData, null, 2));
  }
}

async function run() {
  await testWithWorkshop('2f0af9cc-127d-4c03-8e3b-bd68b26ae3a0', 'Workshop 2f0a');
  await testWithWorkshop('61ee4a0f-8a4d-4d1a-bb75-4d75d058c228', 'Workshop 61ee');
}

run().catch(console.error).finally(() => prisma.$disconnect());

