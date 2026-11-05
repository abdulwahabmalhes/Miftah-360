import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  Min,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus } from '@prisma/client';

export class CheckInVehicleDto {
  @ApiProperty({ description: 'Vehicle odometer reading upon arrival at workshop' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  arrivalMileage!: number;

  @ApiPropertyOptional({ description: 'Visual exterior body condition & scratch notes' })
  @IsString()
  @IsOptional()
  conditionNotes?: string;

  @ApiPropertyOptional({ description: 'Key / belongings handover notes' })
  @IsString()
  @IsOptional()
  handoverNotes?: string;

  @ApiPropertyOptional({ description: 'Fuel tank level upon intake (e.g. 1/4, 1/2, 3/4, Full)' })
  @IsString()
  @IsOptional()
  fuelLevel?: string;

  @ApiPropertyOptional({ description: 'Uploaded photo file IDs for vehicle check-in proof' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  photoFileIds?: string[];
}

export class ConfirmBookingDto {
  @ApiPropertyOptional({ description: 'Confirmed appointment time (defaults to requested start)' })
  @IsDateString()
  @IsOptional()
  startAt?: string;
}

export class MarkNoShowDto {
  @ApiPropertyOptional({ description: 'Explanation notes for client no-show' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CancelBookingDto {
  @ApiProperty({ description: 'Cancellation reason' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class AcceptProposedTimeDto {
  @ApiPropertyOptional({ description: 'Optional client acceptance notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class QueryBookingsDto {
  @ApiPropertyOptional({ enum: BookingStatus })
  @IsEnum(BookingStatus)
  @IsOptional()
  status?: BookingStatus;

  @ApiPropertyOptional({ description: 'Filter bookings for specific date (YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({ description: 'Search customer name, phone, plate number' })
  @IsString()
  @IsOptional()
  search?: string;
}

