import { Emirate } from '../enums/common.enum';
import { WorkshopStaffRole } from '../enums/roles.enum';

export interface UpdateWorkshopProfileDto {
  legalName?: string;
  displayNameEn?: string;
  displayNameAr?: string;
  emirate?: Emirate;
  addressText?: string;
  latitude?: number;
  longitude?: number;
  primaryPhone?: string;
  primaryEmail?: string;
  descriptionEn?: string;
  descriptionAr?: string;
}

export interface WorkshopHourItem {
  weekday: number; // 0 = Sun, 1 = Mon ... 6 = Sat
  openTime: string; // HH:mm
  closeTime: string; // HH:mm
  isClosed: boolean;
}

export interface UpdateWorkshopHoursDto {
  hours: WorkshopHourItem[];
}

export interface UpdateWorkshopBrandsDto {
  allBrands: boolean;
  brandIds?: string[];
}

export interface UpdateWorkshopServiceDto {
  enabled: boolean;
  startingPriceAmount?: number;
  currency?: string;
  notes?: string;
}

export interface InviteStaffDto {
  fullName: string;
  email?: string;
  phone?: string;
  role: WorkshopStaffRole;
}

export interface UpdateStaffRoleDto {
  role: WorkshopStaffRole;
}

