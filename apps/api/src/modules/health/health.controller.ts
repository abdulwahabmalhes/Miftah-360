import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Health & Readiness')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  getLiveness() {
    return {
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'miftah-api',
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe checking database connectivity' })
  async getReadiness() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'UP',
        database: 'CONNECTED',
        timestamp: new Date().toISOString(),
      };
    } catch (e) {
      return {
        status: 'DEGRADED',
        database: 'DISCONNECTED',
        error: (e as Error).message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

