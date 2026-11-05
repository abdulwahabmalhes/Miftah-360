import { Role, WorkshopStaffRole, AdminRole } from '../enums/roles.enum';
import { AuthProvider } from '../enums/common.enum';

export interface JwtPayload {
  sub: string; // user_id
  email?: string;
  phone?: string;
  role: Role;
  workshop_id?: string;
  workshop_staff_role?: WorkshopStaffRole;
  admin_role?: AdminRole;
  mfa_verified?: boolean;
  session_id: string;
  token_version: number;
}

export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    fullName: string;
    email?: string;
    phone?: string;
    role: Role;
    workshopId?: string;
    preferredLanguage: 'ar' | 'en';
  };
}

export interface AdminMfaChallengeResponse {
  mfaRequired: true;
  challengeToken: string;
  message: string;
}

export interface RegisterEmailDto {
  fullName: string;
  email: string;
  password: string;
  preferredLanguage?: 'ar' | 'en';
}

export interface LoginEmailDto {
  email: string;
  password: string;
}

export interface RequestOtpDto {
  phone: string; // E.164 format
}

export interface VerifyOtpDto {
  phone: string;
  code: string;
}

export interface GoogleAuthDto {
  idToken: string;
}

export interface AdminVerifyMfaDto {
  challengeToken: string;
  code: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}
