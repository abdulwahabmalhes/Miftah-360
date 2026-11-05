import { Emirate, VehicleStatus } from '../enums/common.enum';

export interface CreateVehicleDto {
  // Required fields per PO-002
  brandId: string;
  modelId: string;
  year: number;
  mileage: number;

  // Optional fields per PO-002
  trim?: string;
  fuelType?: string;
  transmission?: string;
  vin?: string;
  plateNumber?: string;
  plateCode?: string;
  emirate?: Emirate;
  registrationExpiry?: string;
  insuranceExpiry?: string;
  photoFileId?: string;
  notes?: string;
}

export interface UpdateVehicleDto {
  brandId?: string;
  modelId?: string;
  year?: number;
  mileage?: number;
  trim?: string;
  fuelType?: string;
  transmission?: string;
  vin?: string;
  plateNumber?: string;
  plateCode?: string;
  emirate?: Emirate;
  registrationExpiry?: string;
  insuranceExpiry?: string;
  photoFileId?: string;
  notes?: string;
}

export interface VehicleResponseDto {
  id: string;
  ownerUserId: string;
  brandId: string;
  modelId: string;
  year: number;
  mileage: number;
  trim?: string;
  fuelType?: string;
  transmission?: string;
  vin?: string;
  plateNumber?: string;
  plateCode?: string;
  emirate?: Emirate;
  registrationExpiry?: string;
  insuranceExpiry?: string;
  photoFileId?: string;
  notes?: string;
  status: VehicleStatus;
  createdAt: string;
  updatedAt: string;
  brand?: {
    id: string;
    code: string;
    name: string;
  };
  model?: {
    id: string;
    name: string;
  };
}

