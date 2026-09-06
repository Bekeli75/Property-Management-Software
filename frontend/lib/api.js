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

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'An error occurred');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async patch(endpoint, body) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
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
    return this.put(`/properties/${id}`, data);
  }

  async deleteProperty(id) {
    return this.delete(`/properties/${id}`);
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

  async updateUnit(id, data) {
    return this.put(`/units/${id}`, data);
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

  async updateTenant(id, data) {
    return this.put(`/tenants/${id}`, data);
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

  async updateLease(id, data) {
    return this.put(`/leases/${id}`, data);
  }

  async deleteLease(id) {
    return this.delete(`/leases/${id}`);
  }

  async terminateLease(id, data) {
    return this.post(`/leases/${id}/terminate`, data);
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

  async updatePayment(id, data) {
    return this.put(`/payments/${id}`, data);
  }

  async deletePayment(id) {
    return this.delete(`/payments/${id}`);
  }

  async initiateChapaPayment(data) {
    return this.post('/payments/chapa/initiate', data);
  }

  async chapaCallback(data) {
    return this.post('/payments/chapa/callback', data);
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

  // Expenses
  async getExpenses() {
    return this.get('/expenses');
  }

  async getExpense(id) {
    return this.get(`/expenses/${id}`);
  }

  async createExpense(data) {
    return this.post('/expenses', data);
  }

  async updateExpense(id, data) {
    return this.put(`/expenses/${id}`, data);
  }

  async deleteExpense(id) {
    return this.delete(`/expenses/${id}`);
  }

  // Dashboard
  async getDashboard() {
    return this.get('/dashboard');
  }
}

const apiClient = new ApiClient();

export default apiClient;
