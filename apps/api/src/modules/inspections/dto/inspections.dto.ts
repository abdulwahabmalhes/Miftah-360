import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InspectionSeverity } from '@prisma/client';

export class StartInspectionDto {
  @ApiPropertyOptional({ description: 'Initial inspection notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class AddInspectionFindingDto {
  @ApiProperty({ description: 'Title or component of the issue found (e.g. Front Brake Pad Wear)' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ description: 'Detailed technical description of observation' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: InspectionSeverity, description: 'Severity level: LOW, MEDIUM, HIGH, CRITICAL' })
  @IsEnum(InspectionSeverity)
  @IsNotEmpty()
  severity!: InspectionSeverity;

  @ApiPropertyOptional({ description: 'Proposed canonical Service ID to resolve this finding' })
  @IsUUID()
  @IsOptional()
  proposedServiceId?: string;

  @ApiPropertyOptional({ description: 'Whether this finding is visible in the customer report' })
  @IsBoolean()
  @IsOptional()
  userVisible?: boolean;
}

export class CompleteInspectionDto {
  @ApiPropertyOptional({ description: 'Customer-facing inspection summary report' })
  @IsString()
  @IsOptional()
  summaryUserVisible?: string;

  @ApiPropertyOptional({ description: 'Confidential internal technician observations' })
  @IsString()
  @IsOptional()
  internalNotes?: string;
}

