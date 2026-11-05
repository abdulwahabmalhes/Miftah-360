import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JobStatus, NoteVisibility } from '@prisma/client';

export class AssignTechnicianDto {
  @ApiProperty({ description: 'Workshop staff user ID with TECHNICIAN role' })
  @IsUUID()
  @IsNotEmpty()
  technicianUserId!: string;
}

export class AddJobNoteDto {
  @ApiProperty({ description: 'Note text body' })
  @IsString()
  @IsNotEmpty()
  body!: string;

  @ApiPropertyOptional({ enum: NoteVisibility, default: NoteVisibility.INTERNAL })
  @IsEnum(NoteVisibility)
  @IsOptional()
  visibility?: NoteVisibility;
}

export class CompleteJobDto {
  @ApiPropertyOptional({ description: 'Final vehicle odometer reading upon completion (km)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  finalMileage?: number;

  @ApiPropertyOptional({ description: 'Final operational or handover summary notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class RecordPaymentDto {
  @ApiProperty({ description: 'Amount paid in AED' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  amount!: number;

  @ApiPropertyOptional({ description: 'Payment reference or receipt note' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class QueryJobsDto {
  @ApiPropertyOptional({ enum: JobStatus })
  @IsEnum(JobStatus)
  @IsOptional()
  status?: JobStatus;

  @ApiPropertyOptional({ description: 'Filter by assigned technician user ID' })
  @IsUUID()
  @IsOptional()
  technicianUserId?: string;

  @ApiPropertyOptional({ description: 'Search plate number, customer name, vehicle' })
  @IsString()
  @IsOptional()
  search?: string;
}

