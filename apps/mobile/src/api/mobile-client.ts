import {
  RegisterEmailDto,
  LoginEmailDto,
  RequestOtpDto,
  VerifyOtpDto,
  GoogleAuthDto,
  CreateVehicleDto,
  UpdateVehicleDto,
  VehicleResponseDto,
  ApiErrorResponse,
} from '@miftah/contracts';

export class MobileApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private onUnauthorizedCallback?: () => void;

  constructor(baseUrl: string = 'http://localhost:3000/api/v1') {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  onUnauthorized(cb: () => void) {
    this.onUnauthorizedCallback = cb;
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 401) {
        this.token = null;
        if (this.onUnauthorizedCallback) {
          this.onUnauthorizedCallback();
        }
      }
      const errorPayload = data as ApiErrorResponse;
      const errorMsg = errorPayload?.error?.message || `HTTP ${response.status}: Request failed`;
      const err = new Error(errorMsg);
      (err as any).code = errorPayload?.error?.code;
      (err as any).status = response.status;
      (err as any).details = errorPayload?.error?.details;
      throw err;
    }

    return data as T;
  }

  // --- Auth Flows ---
  async registerEmail(dto: RegisterEmailDto) {
    return this.request<any>('/auth/register/email', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async loginEmail(dto: LoginEmailDto) {
    return this.request<any>('/auth/login/email', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async sendPhoneOtp(dto: RequestOtpDto) {
    return this.request<any>('/auth/otp/send', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async verifyPhoneOtp(dto: VerifyOtpDto) {
    return this.request<any>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async googleSignIn(dto: GoogleAuthDto) {
    return this.request<any>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  // Account Linking
  async linkGoogle(dto: GoogleAuthDto) {
    return this.request<any>('/auth/link/google', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async linkPhone(dto: VerifyOtpDto) {
    return this.request<any>('/auth/link/phone', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  // User Profile
  async getMyProfile() {
    return this.request<any>('/users/me');
  }

  async updateMyProfile(profileData: { fullName?: string; phone?: string; preferredLanguage?: string }) {
    return this.request<any>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(profileData),
    });
  }

  // --- Garage & Vehicles ---
  async listVehicles(includeArchived: boolean = false): Promise<VehicleResponseDto[]> {
    const qs = includeArchived ? '?includeArchived=true' : '';
    return this.request<VehicleResponseDto[]>(`/vehicles${qs}`);
  }

  async getVehicle(id: string): Promise<VehicleResponseDto> {
    return this.request<VehicleResponseDto>(`/vehicles/${id}`);
  }

  async createVehicle(dto: CreateVehicleDto): Promise<VehicleResponseDto> {
    return this.request<VehicleResponseDto>('/vehicles', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async updateVehicle(id: string, dto: UpdateVehicleDto): Promise<VehicleResponseDto> {
    return this.request<VehicleResponseDto>(`/vehicles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  async archiveVehicle(id: string): Promise<VehicleResponseDto> {
    return this.request<VehicleResponseDto>(`/vehicles/${id}`, {
      method: 'DELETE',
    });
  }

  async unarchiveVehicle(id: string): Promise<VehicleResponseDto> {
    return this.request<VehicleResponseDto>(`/vehicles/${id}/unarchive`, {
      method: 'POST',
    });
  }

  async getVehicleHistory(id: string): Promise<any[]> {
    return this.request<any[]>(`/vehicles/${id}/history`).catch(() => []);
  }

  // --- Master Data (Brands & Models) ---
  async getBrands() {
    return this.request<any[]>('/master-data/brands');
  }

  async getModels(brandId: string) {
    return this.request<any[]>(`/master-data/brands/${brandId}/models`);
  }
}

export const mobileApi = new MobileApiClient();
