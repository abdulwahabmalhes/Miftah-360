import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Emirate, ServiceRequestStatus } from '@prisma/client';

export class CreateServiceRequestDto {
  @ApiProperty({ description: 'Target vehicle ID owned by user' })
  @IsUUID()
  @IsNotEmpty()
  vehicleId!: string;

  @ApiProperty({ description: 'Target workshop ID' })
  @IsUUID()
  @IsNotEmpty()
  workshopId!: string;

  @ApiProperty({ description: 'Requested service ID' })
  @IsUUID()
  @IsNotEmpty()
  serviceId!: string;

  @ApiPropertyOptional({ description: 'Summary of vehicle issue / symptom' })
  @IsString()
  @IsOptional()
  issueSummary?: string;

  @ApiProperty({ description: 'Preferred appointment date-time (ISO 8601)' })
  @IsDateString()
  @IsNotEmpty()
  preferredDatetime!: string;

  @ApiProperty({ enum: Emirate, description: 'Emirate where vehicle service is requested' })
  @IsEnum(Emirate)
  @IsNotEmpty()
  emirate!: Emirate;
}

export class AcceptServiceRequestDto {
  @ApiPropertyOptional({ description: 'Internal workshop note or confirmation message' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Confirmed appointment datetime if different from requested' })
  @IsDateString()
  @IsOptional()
  confirmedDatetime?: string;
}

export class RejectServiceRequestDto {
  @ApiProperty({ description: 'Reason for rejecting service request' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class ProposeTimeDto {
  @ApiProperty({ description: 'Alternative proposed start datetime (ISO 8601)' })
  @IsDateString()
  @IsNotEmpty()
  proposedDatetime!: string;

  @ApiPropertyOptional({ description: 'Explanation for proposing alternative time' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class QueryServiceRequestsDto {
  @ApiPropertyOptional({ enum: ServiceRequestStatus })
  @IsEnum(ServiceRequestStatus)
  @IsOptional()
  status?: ServiceRequestStatus;

  @ApiPropertyOptional({ description: 'Search customer name, phone, plate, or vehicle' })
  @IsString()
  @IsOptional()
  search?: string;
}

