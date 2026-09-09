const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

class ApiClient {
  constructor() {
    this.baseURL = API_URL;
    this.token = null;
  }

  setToken(token) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  getToken() {
    if (this.token) {
      return this.token;
    }
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  getRequestBody(body) {
    if (typeof FormData !== 'undefined' && body instanceof FormData) {
      return { body, headers: {} };
    }

    return { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    if (typeof FormData !== 'undefined' && config.body instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    try {
      const response = await fetch(url, config);
      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json')
        ? await response.json()
        : null;

      if (!response.ok) {
        if (response.status === 401 && !endpoint.includes('/auth/login')) {
          this.setToken(null);
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.location.replace('/login');
          }
        }
        throw new Error(this.buildErrorMessage(response.status, endpoint, data));
      }

      if (!data) {
        throw new Error('The service returned an unexpected response. Please try again.');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      if (error instanceof TypeError) {
        throw new Error('Unable to connect to the service. Please try again.');
      }
      throw error;
    }
  }

  buildErrorMessage(status, endpoint, data) {
    if (status === 422 && data && typeof data === 'object') {
      if (data.errors && typeof data.errors === 'object') {
        const firstKey = Object.keys(data.errors)[0];
        if (firstKey) {
          const firstMessage = data.errors[firstKey];
          if (Array.isArray(firstMessage)) return firstMessage[0];
          if (typeof firstMessage === 'string') return firstMessage;
        }
      }
      if (typeof data.message === 'string' && data.message) {
        return data.message;
      }
    }

    return this.getFriendlyError(status, endpoint);
  }

  getFriendlyError(status, endpoint) {
    if (status === 401 && endpoint.includes('/auth/login')) {
      return 'The email or password is incorrect.';
    }

    if (status === 422) {
      return endpoint.includes('/auth/register')
        ? 'Please check your registration details and try again.'
        : 'Please check the information you entered and try again.';
    }

    if (status === 419) {
      return 'Your session expired. Please refresh the page and try again.';
    }

    if (status >= 500) {
      return 'The service is temporarily unavailable. Please try again later.';
    }

    return 'Something went wrong. Please try again.';
  }

  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, body) {
    const requestBody = this.getRequestBody(body);
    return this.request(endpoint, {
      method: 'POST',
      ...requestBody,
    });
  }

  async put(endpoint, body) {
    const requestBody = this.getRequestBody(body);
    return this.request(endpoint, {
      method: 'PUT',
      ...requestBody,
    });
  }

  async patch(endpoint, body) {
    const requestBody = this.getRequestBody(body);
    return this.request(endpoint, {
      method: 'PATCH',
      ...requestBody,
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Auth methods
  async login(email, password) {
    const response = await this.post('/auth/login', { email, password });
    if (response.success && response.data.token) {
      this.setToken(response.data.token);
    }
    return response;
  }

  async register(userData) {
    const response = await this.post('/auth/register', userData);
    if (response.success && response.data.token) {
      this.setToken(response.data.token);
    }
    return response;
  }

  async logout() {
    const response = await this.post('/auth/logout');
    this.setToken(null);
    return response;
  }

  async getMe() {
    return this.get('/auth/me');
  }

  async updateProfile(data) {
    return this.patch('/auth/profile', data);
  }

  async getConversationMessages(tenantId) {
    const params = tenantId ? `?tenant_id=${encodeURIComponent(tenantId)}` : '';
    return this.get(`/tenant-portal/discussions${params}`);
  }

  async getConversations() {
    return this.get('/tenant-portal/conversations');
  }

  async createDiscussion(message, tenantId = null) {
    const body = { message };
    if (tenantId) body.tenant_id = tenantId;
    return this.post('/tenant-portal/discussions', body);
  }

  async getNotifications() {
    return this.get('/tenant-portal/notifications');
  }

  async markNotificationRead(id) {
    return this.patch(`/tenant-portal/notifications/${id}/read`, {});
  }

  async markAllNotificationsRead() {
    return this.patch('/tenant-portal/notifications/read-all', {});
  }

  // Users
  async getUsers(role = null) {
    const endpoint = role ? `/users?role=${role}` : '/users';
    return this.get(endpoint);
  }

  async createUser(data) {
    return this.post('/users', data);
  }

  async updateUserRole(id, role) {
    return this.patch(`/users/${id}`, { role });
  }

  // Properties
  async getProperties() {
    return this.get('/properties');
  }

  async getProperty(id) {
    return this.get(`/properties/${id}`);
  }

  async createProperty(data) {
    return this.post('/properties', data);
  }

  async updateProperty(id, data) {
    if (typeof FormData !== 'undefined' && data instanceof FormData) {
      data.append('_method', 'PATCH');
      return this.post(`/properties/${id}`, data);
    }
    return this.put(`/properties/${id}`, data);
  }

  async deleteProperty(id) {
    return this.delete(`/properties/${id}`);
  }

  async assignManagers(id, managerIds) {
    return this.post(`/properties/${id}/managers`, { manager_ids: managerIds });
  }

  // Units
  async getUnits() {
    return this.get('/units');
  }

  async getUnit(id) {
    return this.get(`/units/${id}`);
  }

  async createUnit(data) {
    return this.post('/units', data);
  }

  async deleteUnit(id) {
    return this.delete(`/units/${id}`);
  }

  async getUnitsByProperty(propertyId) {
    return this.get(`/properties/${propertyId}/units`);
  }

  // Tenants
  async getTenants() {
    return this.get('/tenants');
  }

  async getTenant(id) {
    return this.get(`/tenants/${id}`);
  }

  async createTenant(data) {
    return this.post('/tenants', data);
  }

  async linkTenantUser(tenantId, userId) {
    return this.patch(`/tenants/${tenantId}`, { user_id: userId });
  }

  async unlinkTenantUser(tenantId) {
    return this.patch(`/tenants/${tenantId}`, { user_id: null });
  }

  async deleteTenant(id) {
    return this.delete(`/tenants/${id}`);
  }

  // Leases
  async getLeases() {
    return this.get('/leases');
  }

  async getLease(id) {
    return this.get(`/leases/${id}`);
  }

  async createLease(data) {
    return this.post('/leases', data);
  }

  async deleteLease(id) {
    return this.delete(`/leases/${id}`);
  }

  async terminateLease(id, data) {
    return this.post(`/leases/${id}/terminate`, data);
  }

  async approveTerminationLease(id) {
    return this.post(`/leases/${id}/approve-termination`, {});
  }

  // Payments
  async getPayments() {
    return this.get('/payments');
  }

  async getPayment(id) {
    return this.get(`/payments/${id}`);
  }

  async createPayment(data) {
    return this.post('/payments', data);
  }

  async deletePayment(id) {
    return this.delete(`/payments/${id}`);
  }

  async initiateChapaPayment(data) {
    return this.post('/payments/chapa/initiate', data);
  }

  // Maintenance
  async getMaintenanceRequests() {
    return this.get('/maintenance');
  }

  async getMaintenanceRequest(id) {
    return this.get(`/maintenance/${id}`);
  }

  async createMaintenanceRequest(data) {
    return this.post('/maintenance', data);
  }

  async updateMaintenanceRequest(id, data) {
    return this.put(`/maintenance/${id}`, data);
  }

  async deleteMaintenanceRequest(id) {
    return this.delete(`/maintenance/${id}`);
  }

  async assignMaintenanceRequest(id, data) {
    return this.post(`/maintenance/${id}/assign`, data);
  }

  async completeMaintenanceRequest(id, data) {
    return this.post(`/maintenance/${id}/complete`, data);
  }

  // Dashboard
  async getDashboard() {
    return this.get('/dashboard');
  }

  async getReports(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
    return this.get(`/reports${params.toString() ? `?${params.toString()}` : ''}`);
  }

  async search(query) {
    return this.get(`/search?q=${encodeURIComponent(query)}`);
  }
}

const apiClient = new ApiClient();

export default apiClient;
