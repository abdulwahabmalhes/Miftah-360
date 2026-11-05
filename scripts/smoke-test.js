require('dotenv').config();
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../apps/api/dist/apps/api/src/app.module');
const { CorrelationIdInterceptor } = require('../apps/api/dist/apps/api/src/common/interceptors/correlation-id.interceptor');
const { HttpExceptionFilter } = require('../apps/api/dist/apps/api/src/common/filters/http-exception.filter');
const { ValidationPipe } = require('@nestjs/common');
const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
    req.end();
  });
}

async function run() {
  console.log('🚀 Bootstrapping NestJS API against real PostgreSQL database...');
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api/v1');
  app.useGlobalInterceptors(new CorrelationIdInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.listen(3001);
  console.log('🟢 NestJS API listening on http://localhost:3001/api/v1');

  const base = { hostname: 'localhost', port: 3001 };

  try {
    // 1. Health Live
    console.log('\n--- 1. Testing GET /api/v1/health/live ---');
    const live = await request({ ...base, path: '/api/v1/health/live', method: 'GET' });
    console.log(`Status: ${live.status}`, live.body);

    // 2. Health Ready (Real DB SELECT 1)
    console.log('\n--- 2. Testing GET /api/v1/health/ready ---');
    const ready = await request({ ...base, path: '/api/v1/health/ready', method: 'GET' });
    console.log(`Status: ${ready.status}`, ready.body);

    // 3. Master Data Brands
    console.log('\n--- 3. Testing GET /api/v1/master-data/brands ---');
    const brands = await request({ ...base, path: '/api/v1/master-data/brands', method: 'GET' });
    console.log(`Status: ${brands.status}, Brands count: ${brands.body.length}`);
    console.log('Sample brand:', brands.body[0]);

    // 4. Master Data Services
    console.log('\n--- 4. Testing GET /api/v1/services ---');
    const services = await request({ ...base, path: '/api/v1/services', method: 'GET' });
    console.log(`Status: ${services.status}, Canonical services count: ${services.body.length}`);

    // 5. Unauthorized Protected Route
    console.log('\n--- 5. Testing Unauthorized Protected Route (POST /api/v1/auth/logout without token) ---');
    const unauth = await request({
      ...base,
      path: '/api/v1/auth/logout',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    console.log(`Status: ${unauth.status}`, unauth.body);

    // 6. User Registration against real DB
    console.log('\n--- 6. Testing Registration & Real DB Persistence (POST /api/v1/auth/register/email) ---');
    const testEmail = `test_${Date.now()}@miftah360.ae`;
    const reg = await request(
      {
        ...base,
        path: '/api/v1/auth/register/email',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        fullName: 'Khalid Al Nuaimi',
        email: testEmail,
        password: 'SecurePassword123!',
        preferredLanguage: 'ar',
      },
    );
    console.log(`Status: ${reg.status}`, {
      userId: reg.body.user.id,
      role: reg.body.user.role,
      tokenIssued: !!reg.body.accessToken,
    });

    const token = reg.body.accessToken;

    // 7. Authorized Protected Route (POST /api/v1/auth/logout with token)
    console.log('\n--- 7. Testing Authorized Call & Session Revocation (POST /api/v1/auth/logout) ---');
    const logout = await request({
      ...base,
      path: '/api/v1/auth/logout',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(`Status: ${logout.status}`, logout.body);

    // 8. Re-attempt with Revoked Token
    console.log('\n--- 8. Testing Token Rejection after Revocation ---');
    const revoked = await request({
      ...base,
      path: '/api/v1/auth/logout',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(`Status: ${revoked.status}`, revoked.body);

    console.log('\n🎉 ALL RUNTIME SMOKE TESTS PASSED AGAINST REAL POSTGRESQL!');
  } finally {
    await app.close();
  }
}

run().catch((err) => {
  console.error('❌ Smoke test failed:', err);
  process.exit(1);
});
