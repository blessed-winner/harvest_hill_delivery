const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

export async function apiRequest(endpoint: string, options: RequestInit = {}, _retry = false): Promise<any> {
  const token =
    typeof window !== 'undefined'
      ? window.localStorage.getItem('access_token') || window.localStorage.getItem('accessToken')
      : null;

  const headers = new Headers(options.headers || {});
  
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    if (response.status === 401 && token && typeof window !== 'undefined') {
      const refreshToken = window.localStorage.getItem('refresh_token');
      if (refreshToken && !_retry) {
        if (isRefreshing) {
          return new Promise((resolve) => {
            subscribeTokenRefresh((newToken) => {
              const h = new Headers(options.headers || {});
              h.set('Authorization', `Bearer ${newToken}`);
              resolve(apiRequest(endpoint, { ...options, headers: h }, true));
            });
          });
        }

        isRefreshing = true;
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/api/accounts/token/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken }),
          });
          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            window.localStorage.setItem('access_token', refreshData.access);
            if (refreshData.refresh) {
              window.localStorage.setItem('refresh_token', refreshData.refresh);
            }
            isRefreshing = false;
            onRefreshed(refreshData.access);
            return apiRequest(endpoint, options, true);
          }
        } catch (refreshErr) {
          console.error("Token refresh failed, redirecting to login:", refreshErr);
        } finally {
          isRefreshing = false;
        }
      }
      window.localStorage.removeItem('access_token');
      window.localStorage.removeItem('refresh_token');
      window.location.href = '/login';
      throw new Error("Session expired. Please log in again.");
    }

    let errMsg = `Request failed with status ${response.status}`;
    let errFields: Record<string, any> = {};
    try {
      const errData = await response.json();
      errFields = errData;
      if (errData.errors) {
        errFields = errData.errors;
        const firstKey = Object.keys(errData.errors)[0];
        const val = errData.errors[firstKey];
        errMsg = Array.isArray(val) ? val[0] : String(val);
      } else {
        const keys = Object.keys(errData);
        if (keys.length > 0 && keys[0] !== 'detail' && keys[0] !== 'error') {
          const firstKey = keys[0];
          const val = errData[firstKey];
          errMsg = Array.isArray(val) ? val[0] : String(val);
        } else {
          errMsg = errData.error || errData.detail || errMsg;
        }
      }
    } catch {}
    const error: any = new Error(errMsg);
    error.fields = errFields;
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  // Current User Info
  me: () => apiRequest('/api/accounts/me/'),

  // Dashboard Metrics
  dashboardSummary: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/accounts/admin/dashboard/${query ? '?' + query : ''}`);
  },

  // Notifications
  notifications: () => apiRequest('/api/notifications/'),
  markAllRead: () => apiRequest('/api/notifications/mark-all-read/', { method: 'POST' }),
  markRead: (id: string | number) => apiRequest(`/api/notifications/${id}/`, { method: 'PATCH', body: JSON.stringify({ is_read: true }) }),
  deleteNotification: (id: string | number) => apiRequest(`/api/notifications/${id}/`, { method: 'DELETE' }),
  deleteAllNotifications: () => apiRequest('/api/notifications/delete-all/', { method: 'DELETE' }),

  // User Management
  users: {
    list: (params: Record<string, string> = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiRequest(`/api/accounts/admin/users/${query ? '?' + query : ''}`);
    },
    create: (payload: any) => apiRequest('/api/accounts/admin/users/', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id: string | number, payload: any) => apiRequest(`/api/accounts/admin/users/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) }),
    delete: (id: string | number) => apiRequest(`/api/accounts/admin/users/${id}/`, { method: 'DELETE' }),
  },

  // Product Catalog
  products: {
    list: (params: Record<string, string> = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiRequest(`/api/products/${query ? '?' + query : ''}`);
    },
    create: (payload: any) => {
      const isFormData = payload instanceof FormData;
      return apiRequest('/api/products/', {
        method: 'POST',
        body: isFormData ? payload : JSON.stringify(payload)
      });
    },
    update: (id: string | number, payload: any) => {
      const isFormData = payload instanceof FormData;
      return apiRequest(`/api/products/${id}/`, {
        method: 'PATCH',
        body: isFormData ? payload : JSON.stringify(payload)
      });
    },
    delete: (id: string | number) => apiRequest(`/api/products/${id}/`, { method: 'DELETE' }),
  },

  // Supplies Management
  supplies: {
    list: () => apiRequest('/api/supplies/'),
    update: (id: string | number, payload: any) => apiRequest(`/api/supplies/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) }),
    delete: (id: string | number) => apiRequest(`/api/supplies/${id}/`, { method: 'DELETE' }),
  },

  // Orders Management
  orders: {
    list: () => apiRequest('/api/orders/'),
    create: (payload: any) => apiRequest('/api/orders/', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id: string | number, payload: any) => apiRequest(`/api/orders/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) }),
    delete: (id: string | number) => apiRequest(`/api/orders/${id}/`, { method: 'DELETE' }),
  },

  // Delivery Notes
  deliveryNotes: {
    list: () => apiRequest('/api/delivery-notes/'),
    create: (payload: any) => apiRequest('/api/delivery-notes/', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id: string | number, payload: any) => apiRequest(`/api/delivery-notes/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) }),
    delete: (id: string | number) => apiRequest(`/api/delivery-notes/${id}/`, { method: 'DELETE' }),
  },

  // Invoices Management
  invoices: {
    list: () => apiRequest('/api/invoices/'),
    update: (id: string | number, payload: any) => apiRequest(`/api/invoices/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) }),
  },

  // Reports Management
  reports: {
    get: () => apiRequest('/api/accounts/admin/reports/'),
  },
};
