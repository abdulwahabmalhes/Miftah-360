import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MasterDataService {
  constructor(private readonly prisma: PrismaService) {}

  async getBrands() {
    return this.prisma.vehicleBrand.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }

  async getModelsByBrand(brandId: string) {
    return this.prisma.vehicleModel.findMany({
      where: { brandId, active: true },
      orderBy: { name: 'asc' },
    });
  }

  async getServiceCategories() {
    return this.prisma.serviceCategory.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        services: {
          where: { active: true },
        },
      },
    });
  }

  async getServices(categoryId?: string) {
    return this.prisma.service.findMany({
      where: {
        active: true,
        ...(categoryId ? { categoryId } : {}),
      },
      include: {
        category: true,
      },
      orderBy: { code: 'asc' },
    });
  }

  async getServiceById(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    return service;
  }
}

