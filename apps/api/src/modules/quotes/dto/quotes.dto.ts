import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsArray,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QuoteItemInputDto {
  @ApiProperty({ description: 'Canonical Service ID' })
  @IsUUID()
  @IsNotEmpty()
  serviceId!: string;

  @ApiProperty({ description: 'Line item description (Labor or Part/Material specification)' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ description: 'Quantity (e.g. 1 labor hour, 4 spark plugs, 2 brake discs)' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiProperty({ description: 'Unit price in AED (excluding VAT)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @ApiPropertyOptional({ description: 'Display sort order' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class CreateQuoteRevisionDto {
  @ApiProperty({ type: [QuoteItemInputDto], description: 'List of line items' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteItemInputDto)
  items!: QuoteItemInputDto[];

  @ApiPropertyOptional({ description: 'Discount amount in AED' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @ApiPropertyOptional({ description: 'Validity duration in days (default: 7 days)' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  validDays?: number;
}

export class RejectQuoteDto {
  @ApiPropertyOptional({ description: 'Reason for rejecting quote' })
  @IsString()
  @IsOptional()
  reason?: string;
}

