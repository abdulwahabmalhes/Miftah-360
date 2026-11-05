import { WorkshopStatus } from '../enums/workshop-status.enum';
import { ModuleEntitlementState } from '../enums/modules.enum';
import { InspectionPolicy } from '../enums/common.enum';

export interface AdminUpdateWorkshopStatusDto {
  status: WorkshopStatus;
  reason?: string;
}

export interface AdminUpdateMarketplaceParticipationDto {
  marketplaceParticipation: boolean;
  reason?: string;
}

export interface AdminUpdateModuleEntitlementDto {
  state: ModuleEntitlementState;
  reason: string;
}

export interface AdminCreateServiceDto {
  code: string;
  categoryId: string;
  nameEn: string;
  nameAr: string;
  preliminaryQuoteAllowed: boolean;
  inspectionPolicy: InspectionPolicy;
}

export interface AdminUpdateServiceDto {
  nameEn?: string;
  nameAr?: string;
  active?: boolean;
  preliminaryQuoteAllowed?: boolean;
  inspectionPolicy?: InspectionPolicy;
}

export interface AdminCreateBrandDto {
  code: string;
  name: string;
}

export interface AdminCreateModelDto {
  name: string;
}
