const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

async function testAll() {
  const secret = process.env.JWT_SECRET || 'dev_secret_miftah_360_replace_in_prod';
  const ws1 = '2f0af9cc-127d-4c03-8e3b-bd68b26ae3a0';
  const ws2 = '61ee4a0f-8a4d-4d1a-bb75-4d75d058c228';

  const tokenWs1 = jwt.sign(
    { sub: 'user-1', role: 'WORKSHOP_OWNER', workshop_id: ws1, token_version: 0 },
    secret
  );

  const tokenNoWs = jwt.sign(
    { sub: 'user-2', role: 'CAR_OWNER', token_version: 0 },
    secret
  );

  console.log('--- Test 1: URL query has workshopId=ws2 with tokenWs1 ---');
  let res = await fetch(`http://localhost:3000/api/v1/workshop/inventory/items?workshopId=${ws2}`, {
    headers: { Authorization: `Bearer ${tokenWs1}` }
  });
  console.log('Query param workshopId status:', res.status, await res.json());

  console.log('--- Test 2: URL query has tenantId=ws2 with tokenWs1 ---');
  res = await fetch(`http://localhost:3000/api/v1/workshop/inventory/items?tenantId=${ws2}`, {
    headers: { Authorization: `Bearer ${tokenWs1}` }
  });
  console.log('Query param tenantId status:', res.status, await res.json());

  console.log('--- Test 3: Body has workshopId=ws2 with tokenWs1 ---');
  res = await fetch(`http://localhost:3000/api/v1/workshop/inventory/items/729ccb5c-b305-40ea-b4db-a6c598e496a6/reserve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenWs1}`
    },
    body: JSON.stringify({
      workshopId: ws2,
      jobId: 'any-job',
      quantity: 1
    })
  });
  console.log('Body workshopId status:', res.status, await res.json());

  console.log('--- Test 4: Token without workshop_id accessing inventory ---');
  res = await fetch(`http://localhost:3000/api/v1/workshop/inventory/items`, {
    headers: { Authorization: `Bearer ${tokenNoWs}` }
  });
  console.log('No workshop_id status:', res.status, await res.json());
}

testAll().catch(console.error);

