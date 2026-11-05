const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function testRealFlow() {
  console.log('1. Logging in as owner@workshop.local...');
  const loginRes = await fetch('http://localhost:3000/api/v1/auth/login/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@workshop.local', password: 'ReviewPass123!' }),
  });
  const loginData = await loginRes.json();
  console.log('Login HTTP status:', loginRes.status);
  console.log('Logged-in Workshop ID:', loginData.user?.workshopId);
  console.log('User Role:', loginData.user?.role);

  const token = loginData.accessToken;

  console.log('\n2. Fetching active jobs for this workshop...');
  const jobsRes = await fetch('http://localhost:3000/api/v1/workshop/inventory/active-jobs', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const jobs = await jobsRes.json();
  console.log(`Found ${jobs.length} active jobs:`);
  for (const j of jobs) {
    console.log(`  - Job ${j.id}: ${j.plateNumber} (${j.vehicleDescription}) - Customer: ${j.customerName}`);
  }

  console.log('\n3. Fetching inventory items for this workshop...');
  const itemsRes = await fetch('http://localhost:3000/api/v1/workshop/inventory/items', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const items = await itemsRes.json();
  console.log(`Found ${items.length} items`);
  const shock = items.find(i => i.nameAr.includes('مساعد'));
  console.log(`Target item: ${shock?.nameAr} (ID: ${shock?.id}, onHand: ${shock?.onHandQty}, reserved: ${shock?.reservedQty})`);

  console.log('\n4. Attempting atomic reservation (exact screenshot action)...');
  const targetJob = jobs.find(j => j.plateNumber === 'A 12345') || jobs[0];
  console.log(`Reserving for target job: ${targetJob.id} (Plate: ${targetJob.plateNumber}, Customer: ${targetJob.customerName})`);

  const reserveRes = await fetch(`http://localhost:3000/api/v1/workshop/inventory/items/${shock.id}/reserve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      jobId: targetJob.id,
      quantity: 1,
      unitPrice: 460,
      notes: `حجز لصيانة مركبة: ${targetJob.plateNumber} (${targetJob.vehicleDescription}) - العميل: ${targetJob.customerName}`,
    }),
  });

  console.log('Reservation HTTP status:', reserveRes.status);
  const reserveData = await reserveRes.json();
  console.log('Reservation response:', JSON.stringify(reserveData, null, 2));

  if (reserveRes.status === 201) {
    console.log('\n🎉 SUCCESS! Atomically reserved 1 unit of shock absorber without ANY tenant error!');
  } else {
    console.error('\n❌ Failed with error:', reserveData);
  }
}

testRealFlow().catch(console.error);

