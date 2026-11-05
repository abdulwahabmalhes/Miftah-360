import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';

async function generateOpenApi() {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('Miftah 360 API')
    .setDescription('Production-grade Phase 1 REST API for Miftah 360 Automotive Ecosystem (Dubai & Sharjah)')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const outputPath = path.resolve(__dirname, '../openapi.json');
  fs.writeFileSync(outputPath, JSON.stringify(document, null, 2), 'utf8');
  console.log(`✅ OpenAPI specification generated at: ${outputPath}`);

  await app.close();
  process.exit(0);
}

generateOpenApi().catch((err) => {
  console.error('Failed to generate OpenAPI:', err);
  process.exit(1);
});

