import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtPayload } from '@miftah/contracts';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantIsolationGuard } from '../../common/guards/tenant-isolation.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateSubcategoryDto,
  UpdateSubcategoryDto,
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
  StockInDto,
  ReserveForJobDto,
  DispenseToTechnicianDto,
  ReleaseReservationDto,
  ReturnFromJobDto,
  ReconciliationDto,
} from './dto/inventory.dto';
import { StockMovementType, InventoryItemStatus } from '@prisma/client';

@ApiTags('Workshop OS Inventory & Spare Parts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, TenantIsolationGuard)
@Controller('workshop/inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // -------------------------------------------------------------
  // CATEGORIES & SUBCATEGORIES
  // -------------------------------------------------------------
  @Get('categories')
  @ApiOperation({ summary: 'Get workshop categories tree with subcategories' })
  async getCategories(@CurrentUser() user: JwtPayload) {
    return this.inventoryService.getCategories(user.workshop_id!);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create new main category for workshop' })
  async createCategory(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.inventoryService.createCategory(user.workshop_id!, dto);
  }

  @Patch('categories/:categoryId')
  @ApiOperation({ summary: 'Update or archive main category' })
  async updateCategory(
    @CurrentUser() user: JwtPayload,
    @Param('categoryId') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.inventoryService.updateCategory(user.workshop_id!, id, dto);
  }

  @Post('subcategories')
  @ApiOperation({ summary: 'Create subcategory under a main category' })
  async createSubcategory(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateSubcategoryDto,
  ) {
    return this.inventoryService.createSubcategory(user.workshop_id!, dto);
  }

  @Patch('subcategories/:subcategoryId')
  @ApiOperation({ summary: 'Update or archive subcategory' })
  async updateSubcategory(
    @CurrentUser() user: JwtPayload,
    @Param('subcategoryId') id: string,
    @Body() dto: UpdateSubcategoryDto,
  ) {
    return this.inventoryService.updateSubcategory(user.workshop_id!, id, dto);
  }

  // -------------------------------------------------------------
  // ITEMS / PARTS CATALOG
  // -------------------------------------------------------------
  @Get('items')
  @ApiOperation({ summary: 'List workshop inventory parts with live balances' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'subcategoryId', required: false })
  @ApiQuery({ name: 'lowStockOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'status', required: false, enum: InventoryItemStatus })
  async getItems(
    @CurrentUser() user: JwtPayload,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('subcategoryId') subcategoryId?: string,
    @Query('lowStockOnly') lowStockOnly?: string,
    @Query('status') status?: InventoryItemStatus,
  ) {
    return this.inventoryService.getItems(user.workshop_id!, {
      search,
      categoryId,
      subcategoryId,
      lowStockOnly: lowStockOnly === 'true',
      status,
    });
  }

  @Get('items/:itemId')
  @ApiOperation({ summary: 'Get single inventory item details and movements' })
  async getItemById(
    @CurrentUser() user: JwtPayload,
    @Param('itemId') id: string,
  ) {
    return this.inventoryService.getItemById(user.workshop_id!, id);
  }

  @Post('items')
  @ApiOperation({ summary: 'Register new inventory item with mandatory category & subcategory' })
  async createItem(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateInventoryItemDto,
  ) {
    return this.inventoryService.createItem(user.workshop_id!, dto, user.sub);
  }

  @Patch('items/:itemId')
  @ApiOperation({ summary: 'Update inventory item metadata' })
  async updateItem(
    @CurrentUser() user: JwtPayload,
    @Param('itemId') id: string,
    @Body() dto: UpdateInventoryItemDto,
  ) {
    return this.inventoryService.updateItem(user.workshop_id!, id, dto);
  }

  // -------------------------------------------------------------
  // OPERATIONAL LIFECYCLE
  // -------------------------------------------------------------
  @Post('items/:itemId/stock-in')
  @ApiOperation({ summary: 'Receive shipment / stock in from supplier' })
  async stockIn(
    @CurrentUser() user: JwtPayload,
    @Param('itemId') id: string,
    @Body() dto: StockInDto,
  ) {
    return this.inventoryService.stockIn(user.workshop_id!, id, dto, user.sub);
  }

  @Post('items/:itemId/reserve')
  @ApiOperation({ summary: 'Reserve stock for a specific Job Order' })
  async reserveForJob(
    @CurrentUser() user: JwtPayload,
    @Param('itemId') id: string,
    @Body() dto: ReserveForJobDto,
  ) {
    return this.inventoryService.reserveForJob(user.workshop_id!, id, dto, user.sub);
  }

  @Post('reservations/:reservationId/dispense')
  @ApiOperation({ summary: 'Dispense reserved part to technician for installation' })
  async dispenseToTechnician(
    @CurrentUser() user: JwtPayload,
    @Param('reservationId') id: string,
    @Body() dto: DispenseToTechnicianDto,
  ) {
    return this.inventoryService.dispenseToTechnician(user.workshop_id!, id, dto, user.sub);
  }

  @Post('reservations/:reservationId/release')
  @ApiOperation({ summary: 'Release unissued reserved stock back to available pool' })
  async releaseReservation(
    @CurrentUser() user: JwtPayload,
    @Param('reservationId') id: string,
    @Body() dto: ReleaseReservationDto,
  ) {
    return this.inventoryService.releaseReservation(user.workshop_id!, id, dto, user.sub);
  }

  @Post('reservations/:reservationId/return')
  @ApiOperation({ summary: 'Return part from job (good returns to stock, defective logged as scrap)' })
  async returnFromJob(
    @CurrentUser() user: JwtPayload,
    @Param('reservationId') id: string,
    @Body() dto: ReturnFromJobDto,
  ) {
    return this.inventoryService.returnFromJob(user.workshop_id!, id, dto, user.sub);
  }

  @Post('items/:itemId/reconcile')
  @ApiOperation({ summary: 'Reconcile stock following physical cycle count' })
  async reconcileStock(
    @CurrentUser() user: JwtPayload,
    @Param('itemId') id: string,
    @Body() dto: ReconciliationDto,
  ) {
    return this.inventoryService.reconcileStock(user.workshop_id!, id, dto, user.sub);
  }

  // -------------------------------------------------------------
  // AUDIT LEDGER & JOB INTEGRATION
  // -------------------------------------------------------------
  @Get('movements')
  @ApiOperation({ summary: 'Audit ledger of all inventory movements' })
  @ApiQuery({ name: 'itemId', required: false })
  @ApiQuery({ name: 'movementType', required: false, enum: StockMovementType })
  @ApiQuery({ name: 'jobId', required: false })
  async getMovements(
    @CurrentUser() user: JwtPayload,
    @Query('itemId') itemId?: string,
    @Query('movementType') movementType?: StockMovementType,
    @Query('jobId') jobId?: string,
  ) {
    return this.inventoryService.getMovements(user.workshop_id!, {
      itemId,
      movementType,
      jobId,
    });
  }

  @Get('active-jobs')
  @ApiOperation({ summary: 'List active workshop jobs and vehicles for part reservation and customer sales' })
  async getActiveJobs(@CurrentUser() user: JwtPayload) {
    return this.inventoryService.getActiveJobs(user.workshop_id!);
  }

  @Get('jobs/:jobId/reservations')
  @ApiOperation({ summary: 'Get all part reservations for a specific Job Order' })
  async getJobReservations(
    @CurrentUser() user: JwtPayload,
    @Param('jobId') jobId: string,
  ) {
    return this.inventoryService.getJobReservations(user.workshop_id!, jobId);
  }
}

