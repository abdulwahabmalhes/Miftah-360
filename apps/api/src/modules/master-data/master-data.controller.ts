import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MasterDataService } from './master-data.service';

@ApiTags('Master Data & Taxonomy')
@Controller()
export class MasterDataController {
  constructor(private readonly masterDataService: MasterDataService) {}

  @Get('master-data/brands')
  @ApiOperation({ summary: 'List all active vehicle brands' })
  @ApiResponse({ status: 200, description: 'List of brands returned' })
  async getBrands() {
    return this.masterDataService.getBrands();
  }

  @Get('master-data/brands/:brandId/models')
  @ApiOperation({ summary: 'List models for a specific brand' })
  @ApiResponse({ status: 200, description: 'List of models returned' })
  async getModels(@Param('brandId') brandId: string) {
    return this.masterDataService.getModelsByBrand(brandId);
  }

  @Get('services/categories')
  @ApiOperation({ summary: 'List central service categories with active services' })
  @ApiResponse({ status: 200, description: 'List of categories returned' })
  async getServiceCategories() {
    return this.masterDataService.getServiceCategories();
  }

  @Get('services')
  @ApiOperation({ summary: 'List all active canonical services' })
  @ApiResponse({ status: 200, description: 'List of services returned' })
  async getServices(@Query('categoryId') categoryId?: string) {
    return this.masterDataService.getServices(categoryId);
  }

  @Get('services/:serviceId')
  @ApiOperation({ summary: 'Get details of a specific canonical service' })
  @ApiResponse({ status: 200, description: 'Service details returned' })
  async getServiceById(@Param('serviceId') serviceId: string) {
    return this.masterDataService.getServiceById(serviceId);
  }
}

