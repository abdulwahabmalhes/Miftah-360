import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QualityTier, InventoryItemStatus, StockMovementType, JobReservationStatus } from '@prisma/client';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCategoryDto {
  @ApiProperty({ example: 'الفرامل' })
  @IsString()
  @IsNotEmpty()
  nameAr!: string;

  @ApiPropertyOptional({ example: 'Brakes' })
  @IsString()
  @IsOptional()
  nameEn?: string;

  @ApiPropertyOptional({ example: 'disc' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nameAr?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nameEn?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;
}

export class CreateSubcategoryDto {
  @ApiProperty({ description: 'Parent Category ID' })
  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @ApiProperty({ example: 'فحمات الفرامل' })
  @IsString()
  @IsNotEmpty()
  nameAr!: string;

  @ApiPropertyOptional({ example: 'Brake Pads' })
  @IsString()
  @IsOptional()
  nameEn?: string;

  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateSubcategoryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nameAr?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nameEn?: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;
}

export class CreateInventoryItemDto {
  @ApiProperty({ description: 'Mandatory Category ID' })
  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @ApiProperty({ description: 'Mandatory Subcategory ID' })
  @IsString()
  @IsNotEmpty()
  subcategoryId!: string;

  @ApiProperty({ example: 'BRK-CAM-001', description: 'Unique SKU in workshop' })
  @IsString()
  @IsNotEmpty()
  sku!: string;

  @ApiPropertyOptional({ example: '04465-33471' })
  @IsString()
  @IsOptional()
  oemPartNumber?: string;

  @ApiProperty({ example: 'فحمات فرامل أمامية كامري' })
  @IsString()
  @IsNotEmpty()
  nameAr!: string;

  @ApiPropertyOptional({ example: 'Front Brake Pads Camry' })
  @IsString()
  @IsOptional()
  nameEn?: string;

  @ApiPropertyOptional({ example: 'Toyota Genuine / Akebono' })
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiPropertyOptional({ enum: QualityTier, default: QualityTier.OEM })
  @IsEnum(QualityTier)
  @IsOptional()
  qualityTier?: QualityTier;

  @ApiPropertyOptional({ example: 'طقم', default: 'قطعة' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({ example: 10, default: 0 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  initialQty?: number;

  @ApiPropertyOptional({ example: 5, default: 5 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  reorderLevel?: number;

  @ApiPropertyOptional({ example: 120, default: 0 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  costPrice?: number;

  @ApiPropertyOptional({ example: 220, default: 0 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  sellingPrice?: number;

  @ApiPropertyOptional({ example: 'مستودع أ - رف 3' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ example: 'Toyota Camry 2018-2024' })
  @IsOptional()
  compatibleVehicles?: any;

  @ApiPropertyOptional({ example: 'فحمات سيراميك أصلية خالية من الضوضاء' })
  @IsString()
  @IsOptional()
  descriptionAr?: string;

  @ApiPropertyOptional({ example: 'الفطيم للسيارات' })
  @IsString()
  @IsOptional()
  supplierName?: string;

  @ApiPropertyOptional({ example: 12 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  warrantyMonths?: number;
}

export class UpdateInventoryItemDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nameAr?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nameEn?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  oemPartNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiPropertyOptional({ enum: QualityTier })
  @IsEnum(QualityTier)
  @IsOptional()
  qualityTier?: QualityTier;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  reorderLevel?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  costPrice?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  sellingPrice?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  compatibleVehicles?: any;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  descriptionAr?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  supplierName?: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  warrantyMonths?: number;

  @ApiPropertyOptional({ enum: InventoryItemStatus })
  @IsEnum(InventoryItemStatus)
  @IsOptional()
  status?: InventoryItemStatus;
}

export class StockInDto {
  @ApiProperty({ example: 10, description: 'Quantity to receive' })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  quantity!: number;

  @ApiPropertyOptional({ example: 115, description: 'Unit cost in AED' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  unitCost?: number;

  @ApiPropertyOptional({ example: 'الفطيم لتوزيع قطع الغيار' })
  @IsString()
  @IsOptional()
  supplierName?: string;

  @ApiPropertyOptional({ example: 'INV-2026-9811' })
  @IsString()
  @IsOptional()
  supplierInvoiceNo?: string;

  @ApiPropertyOptional({ example: 'توريد دفعة صيانة موسمية' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class ReserveForJobDto {
  @ApiProperty({ description: 'Target Job Order ID' })
  @IsString()
  @IsNotEmpty()
  jobId!: string;

  @ApiProperty({ example: 2, description: 'Quantity needed for the job' })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  quantity!: number;

  @ApiPropertyOptional({ example: 220, description: 'Selling price per unit for customer quote' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  unitPrice?: number;

  @ApiPropertyOptional({ example: 'حجز لصيانة فحمات الكامري' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class DispenseToTechnicianDto {
  @ApiProperty({ example: 2, description: 'Quantity handed over to technician' })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  quantity!: number;

  @ApiPropertyOptional({ example: 'فني الميكانيكا أحمد' })
  @IsString()
  @IsOptional()
  technicianName?: string;

  @ApiPropertyOptional({ example: 'تسليم الفحمات للتركيب الفوري' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class ReleaseReservationDto {
  @ApiPropertyOptional({ example: 'العميل ألغى استبدال القطعة' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class ReturnFromJobDto {
  @ApiProperty({ example: 1, description: 'Quantity returned' })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  quantity!: number;

  @ApiPropertyOptional({ example: false, description: 'Is part defective/scrap' })
  @IsBoolean()
  @IsOptional()
  isDefective?: boolean;

  @ApiPropertyOptional({ example: 'كسر أثناء الفك' })
  @IsString()
  @IsOptional()
  defectReason?: string;

  @ApiPropertyOptional({ example: 'إرجاع للمستودع بحالة المصنع' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class ReconciliationDto {
  @ApiProperty({ example: 8, description: 'Physical counted quantity on shelf' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  countedQty!: number;

  @ApiProperty({ example: 'جرد دوري لشهر نوفمبر', description: 'Mandatory reason for reconciliation' })
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
