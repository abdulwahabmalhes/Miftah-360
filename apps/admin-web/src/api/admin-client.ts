import {
  WorkshopStatus,
  ModuleEntitlementState,
  AdminUpdateMarketplaceParticipationDto,
  AdminCreateServiceDto,
  AdminUpdateServiceDto,
  AdminCreateBrandDto,
  AdminCreateModelDto,
  ApiErrorResponse,
} from '@miftah/contracts';

export class AdminApiClient {
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

  // Auth
  async login(email: string, password: string) {
    return this.request<any>('/auth/login/email', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async verifyMfa(challengeToken: string, code: string) {
    return this.request<any>('/auth/admin/mfa/verify', {
      method: 'POST',
      body: JSON.stringify({ challengeToken, code }),
    });
  }

  // Workshops
  async listWorkshops(status?: WorkshopStatus, emirate?: string) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (emirate) params.append('emirate', emirate);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<any[]>(`/admin/workshops${qs}`);
  }

  async getWorkshops(status?: string, emirate?: string) {
    return this.listWorkshops(status as any, emirate);
  }

  async getWorkshop(id: string) {
    return this.request<any>(`/admin/workshops/${id}`);
  }

  async getWorkshopDetails(id: string) {
    return this.getWorkshop(id);
  }

  async approveWorkshop(id: string) {
    return this.request<any>(`/admin/workshops/${id}/approve`, { method: 'POST' });
  }

  async rejectWorkshop(id: string, reason: string) {
    return this.request<any>(`/admin/workshops/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async suspendWorkshop(id: string, reason: string) {
    return this.request<any>(`/admin/workshops/${id}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async reactivateWorkshop(id: string) {
    return this.request<any>(`/admin/workshops/${id}/reactivate`, { method: 'POST' });
  }

  async deactivateWorkshop(id: string, reason: string) {
    return this.request<any>(`/admin/workshops/${id}/deactivate`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async updateMarketplaceParticipation(id: string, dto: AdminUpdateMarketplaceParticipationDto) {
    return this.request<any>(`/admin/workshops/${id}/marketplace-participation`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  // Modules
  async listModules() {
    return this.request<any[]>('/admin/modules');
  }

  async getWorkshopEntitlements(workshopId: string) {
    return this.request<any[]>(`/admin/workshops/${workshopId}/entitlements`);
  }

  async enableModule(workshopId: string, moduleCode: string, reason: string) {
    return this.request<any>(`/admin/workshops/${workshopId}/entitlements/${moduleCode}/enable`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async disableModule(workshopId: string, moduleCode: string, reason: string) {
    return this.request<any>(`/admin/workshops/${workshopId}/entitlements/${moduleCode}/disable`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Master Data
  async listCategories() {
    return this.request<any[]>('/services/categories');
  }

  async listServices(categoryId?: string) {
    const qs = categoryId ? `?categoryId=${categoryId}` : '';
    return this.request<any[]>(`/services${qs}`);
  }

  async getTaxonomy() {
    return this.listServices();
  }

  async listBrands() {
    return this.request<any[]>('/master-data/brands');
  }

  async getBrands() {
    return this.listBrands();
  }

  async listModels(brandId: string) {
    return this.request<any[]>(`/master-data/brands/${brandId}/models`);
  }

  async createBrand(dto: AdminCreateBrandDto) {
    return this.request<any>('/admin/vehicle-brands', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async createModel(brandId: string, dto: AdminCreateModelDto) {
    return this.request<any>(`/admin/vehicle-brands/${brandId}/models`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }
}

export const adminApi = new AdminApiClient();
