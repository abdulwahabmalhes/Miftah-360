import {
  UpdateWorkshopProfileDto,
  UpdateWorkshopHoursDto,
  UpdateWorkshopBrandsDto,
  UpdateWorkshopServiceDto,
  InviteStaffDto,
  UpdateStaffRoleDto,
  WorkshopStaffRole,
  ApiErrorResponse,
} from '@miftah/contracts';

export class WorkshopApiClient {
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

  // Auth (Email or Phone OTP only - strictly NO Google for Workshop staff)
  async loginEmail(email: string, pass: string) {
    return this.request<any>('/auth/login/email', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass }),
    });
  }

  async sendOtp(phone: string) {
    return this.request<any>('/auth/otp/send', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  async verifyOtp(phone: string, code: string) {
    return this.request<any>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    });
  }

  // Workshop Profile
  async getProfile() {
    return this.request<any>('/workshop/me');
  }

  async updateProfile(dto: UpdateWorkshopProfileDto) {
    return this.request<any>('/workshop/me', {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  // Working Hours
  async getHours() {
    const me = await this.getProfile();
    return me.hours || [];
  }

  async updateHours(dto: UpdateWorkshopHoursDto) {
    return this.request<any>('/workshop/me/hours', {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  }

  // Brands
  async getBrands() {
    const me = await this.getProfile();
    return {
      allBrands: me.allBrands ?? false,
      supportedBrands: me.supportedBrands?.map((b: any) => b.brandId) || [],
    };
  }

  async updateBrands(dto: UpdateWorkshopBrandsDto) {
    return this.request<any>('/workshop/me/brands', {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  }

  async getMasterBrands() {
    return this.request<any[]>('/master-data/brands');
  }

  // Services & Starting Pricing
  async getServices() {
    return this.request<any[]>('/workshop/me/services');
  }

  async updateService(serviceId: string, dto: UpdateWorkshopServiceDto) {
    return this.request<any>(`/workshop/me/services/${serviceId}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  }

  async getTaxonomy() {
    return this.request<any[]>('/services');
  }

  // Staff Management
  async getStaff() {
    return this.request<any[]>('/workshop/staff');
  }

  async inviteStaff(dto: InviteStaffDto) {
    return this.request<any>('/workshop/staff/invitations', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async updateStaffRole(membershipId: string, role: WorkshopStaffRole) {
    return this.request<any>(`/workshop/staff/${membershipId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  async disableStaff(membershipId: string) {
    return this.request<any>(`/workshop/staff/${membershipId}/disable`, {
      method: 'POST',
    });
  }

  async enableStaff(membershipId: string) {
    return this.request<any>(`/workshop/staff/${membershipId}/enable`, {
      method: 'POST',
    });
  }

  // Customers & Vehicles (Workshop Core read view)
  async getCustomers() {
    return this.request<any[]>('/workshop/customers');
  }

  // -------------------------------------------------------------
  // Service Requests (Canonical Service Journey)
  // -------------------------------------------------------------
  async getServiceRequests(params?: { status?: string; search?: string }) {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.search) q.set('search', params.search);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request<any[]>(`/workshop/service-requests${qs}`);
  }

  async getServiceRequestById(id: string) {
    return this.request<any>(`/workshop/service-requests/${id}`);
  }

  async acceptServiceRequest(id: string, dto?: { notes?: string; confirmedDatetime?: string }) {
    return this.request<any>(`/workshop/service-requests/${id}/accept`, {
      method: 'POST',
      body: JSON.stringify(dto || {}),
    });
  }

  async rejectServiceRequest(id: string, reason: string) {
    return this.request<any>(`/workshop/service-requests/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async proposeServiceRequestTime(id: string, proposedDatetime: string, notes?: string) {
    return this.request<any>(`/workshop/service-requests/${id}/propose-time`, {
      method: 'POST',
      body: JSON.stringify({ proposedDatetime, notes }),
    });
  }

  // -------------------------------------------------------------
  // Bookings & Vehicle Arrival Check-In
  // -------------------------------------------------------------
  async getBookings(params?: { status?: string; date?: string; search?: string }) {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.date) q.set('date', params.date);
    if (params?.search) q.set('search', params.search);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return this.request<any[]>(`/workshop/bookings${qs}`);
  }

  async getBookingById(id: string) {
    return this.request<any>(`/workshop/bookings/${id}`);
  }

  async confirmBooking(id: string, startAt?: string) {
    return this.request<any>(`/workshop/bookings/${id}/confirm`, {
      method: 'POST',
      body: JSON.stringify(startAt ? { startAt } : {}),
    });
  }

  async checkInVehicle(
    bookingId: string,
    dto: {
      arrivalMileage: number;
      conditionNotes?: string;
      handoverNotes?: string;
      fuelLevel?: string;
      photoFileIds?: string[];
    },
  ) {
    return this.request<any>(`/workshop/bookings/${bookingId}/check-in`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async markBookingNoShow(id: string, notes?: string) {
    return this.request<any>(`/workshop/bookings/${id}/no-show`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  async cancelBooking(id: string, reason: string) {
    return this.request<any>(`/workshop/bookings/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // -------------------------------------------------------------
  // Technical Inspections & Findings
  // -------------------------------------------------------------
  async startInspection(jobId: string, notes?: string) {
    return this.request<any>(`/workshop/inspections/jobs/${jobId}/start`, {
      method: 'POST',
      body: JSON.stringify(notes ? { notes } : {}),
    });
  }

  async getInspection(id: string) {
    return this.request<any>(`/workshop/inspections/${id}`);
  }

  async addInspectionFinding(
    inspectionId: string,
    dto: {
      title: string;
      description?: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      proposedServiceId?: string;
      userVisible?: boolean;
    },
  ) {
    return this.request<any>(`/workshop/inspections/${inspectionId}/findings`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async completeInspection(
    inspectionId: string,
    dto?: { summaryUserVisible?: string; internalNotes?: string },
  ) {
    return this.request<any>(`/workshop/inspections/${inspectionId}/complete`, {
      method: 'POST',
      body: JSON.stringify(dto || {}),
    });
  }

  // -------------------------------------------------------------
  // Quotes & Revision Families
  // -------------------------------------------------------------
  async getJobQuotes(jobId: string) {
    return this.request<any>(`/workshop/quotes/jobs/${jobId}`);
  }

  async createOrUpdateQuoteDraft(
    jobId: string,
    dto: {
      items: Array<{
        serviceId: string;
        description: string;
        quantity: number;
        unitPrice: number;
      }>;
      discount?: number;
      validDays?: number;
    },
  ) {
    return this.request<any>(`/workshop/quotes/jobs/${jobId}`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async sendQuote(revisionId: string) {
    return this.request<any>(`/workshop/quotes/revisions/${revisionId}/send`, {
      method: 'POST',
    });
  }

  async acceptQuote(revisionId: string) {
    return this.request<any>(`/quotes/revisions/${revisionId}/accept`, {
      method: 'POST',
    });
  }

  async rejectQuote(revisionId: string, reason?: string) {
    return this.request<any>(`/quotes/revisions/${revisionId}/reject`, {
      method: 'POST',
      body: JSON.stringify(reason ? { reason } : {}),
    });
  }

  // -------------------------------------------------------------
  // Inventory & Spare Parts API
  // -------------------------------------------------------------
  async getInventoryCategories() {
    return this.request<any[]>('/workshop/inventory/categories');
  }

  async createInventoryCategory(dto: { nameAr: string; nameEn?: string; icon?: string; sortOrder?: number }) {
    return this.request<any>('/workshop/inventory/categories', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async updateInventoryCategory(id: string, dto: any) {
    return this.request<any>(`/workshop/inventory/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  async createInventorySubcategory(dto: { categoryId: string; nameAr: string; nameEn?: string; sortOrder?: number }) {
    return this.request<any>('/workshop/inventory/subcategories', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async updateInventorySubcategory(id: string, dto: any) {
    return this.request<any>(`/workshop/inventory/subcategories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  async getInventoryItems(params?: { search?: string; categoryId?: string; subcategoryId?: string; lowStockOnly?: boolean }) {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.categoryId) q.set('categoryId', params.categoryId);
    if (params?.subcategoryId) q.set('subcategoryId', params.subcategoryId);
    if (params?.lowStockOnly) q.set('lowStockOnly', 'true');
    const qs = q.toString();
    return this.request<any[]>(`/workshop/inventory/items${qs ? `?${qs}` : ''}`);
  }

  async getInventoryItem(id: string) {
    return this.request<any>(`/workshop/inventory/items/${id}`);
  }

  async createInventoryItem(dto: any) {
    return this.request<any>('/workshop/inventory/items', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async updateInventoryItem(id: string, dto: any) {
    return this.request<any>(`/workshop/inventory/items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  async stockInInventoryItem(id: string, dto: { quantity: number; unitCost?: number; supplierName?: string; supplierInvoiceNo?: string; notes?: string }) {
    return this.request<any>(`/workshop/inventory/items/${id}/stock-in`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async reservePartForJob(itemId: string, dto: { jobId: string; quantity: number; unitPrice?: number; notes?: string }) {
    return this.request<any>(`/workshop/inventory/items/${itemId}/reserve`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async dispensePartToTechnician(reservationId: string, dto: { quantity: number; technicianName?: string; notes?: string }) {
    return this.request<any>(`/workshop/inventory/reservations/${reservationId}/dispense`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async releasePartReservation(reservationId: string, dto?: { notes?: string }) {
    return this.request<any>(`/workshop/inventory/reservations/${reservationId}/release`, {
      method: 'POST',
      body: JSON.stringify(dto || {}),
    });
  }

  async returnPartFromJob(reservationId: string, dto: { quantity: number; isDefective?: boolean; defectReason?: string; notes?: string }) {
    return this.request<any>(`/workshop/inventory/reservations/${reservationId}/return`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async reconcileInventoryItem(id: string, dto: { countedQty: number; reason: string; notes?: string }) {
    return this.request<any>(`/workshop/inventory/items/${id}/reconcile`, {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async getInventoryMovements(params?: { itemId?: string; movementType?: string; jobId?: string }) {
    const q = new URLSearchParams();
    if (params?.itemId) q.set('itemId', params.itemId);
    if (params?.movementType) q.set('movementType', params.movementType);
    if (params?.jobId) q.set('jobId', params.jobId);
    const qs = q.toString();
    return this.request<any[]>(`/workshop/inventory/movements${qs ? `?${qs}` : ''}`);
  }

  async getActiveJobs() {
    return this.request<any[]>('/workshop/inventory/active-jobs');
  }

  async getJobPartReservations(jobId: string) {
    return this.request<any[]>(`/workshop/inventory/jobs/${jobId}/reservations`);
  }
}

export const workshopApi = new WorkshopApiClient();
