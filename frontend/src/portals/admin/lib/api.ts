export function formatCurrency(value: unknown, fallback = '$0.00') {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'string') {
    if (value.startsWith('$')) return value;
    const parsed = Number(value);
    return Number.isFinite(parsed)
      ? `$${parsed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : value;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return `$${parsed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
if (!API_BASE) {
  throw new Error('[api.ts] NEXT_PUBLIC_API_URL is not set. Check your Vercel environment variables.');
}

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
  const method = (options.method ?? 'GET').toUpperCase();
  const token =
    typeof window !== 'undefined'
      ? window.localStorage.getItem('access_token') || window.localStorage.getItem('accessToken')
      : null;

  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    method,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      const refreshToken = window.localStorage.getItem('refresh_token');
      if (refreshToken && !_retry) {
        if (isRefreshing) {
          return new Promise((resolve) => {
            subscribeTokenRefresh((newToken) => {
              const h = (options.headers || {}) as Record<string, string>;
              h['Authorization'] = `Bearer ${newToken}`;
              resolve(apiRequest(endpoint, { ...options, headers: h }, true));
            });
          });
        }

        isRefreshing = true;
        try {
          const refreshRes = await fetch(`${API_BASE}/api/accounts/token/refresh/`, {
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
          console.error("Token refresh failed:", refreshErr);
        } finally {
          isRefreshing = false;
        }
      }
      window.localStorage.removeItem('access_token');
      window.localStorage.removeItem('refresh_token');
      window.localStorage.removeItem('user_role');
      window.location.href = '/login';
    }
    let errMsg = `Request failed: ${response.status} ${response.statusText}`;
    try {
      const errData = await response.json();
      const errors = errData.errors ?? errData;
      if (errors?.non_field_errors?.length) {
        errMsg = errors.non_field_errors[0];
      } else if (typeof errors === 'object' && errors !== null) {
        const firstKey = Object.keys(errors)[0];
        if (firstKey) {
          const value = errors[firstKey];
          errMsg = Array.isArray(value) ? value[0] : String(value);
        }
      } else {
        errMsg = errData.error || errData.detail || errMsg;
      }
    } catch {}
    throw new Error(errMsg);
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
  },

  // Orders Management
  orders: {
    list: () => apiRequest('/api/orders/'),
    create: (payload: any) => apiRequest('/api/orders/', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id: string | number, payload: any) => apiRequest(`/api/orders/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) }),
  },

  // Delivery Notes
  deliveryNotes: {
    list: () => apiRequest('/api/delivery-notes/'),
    create: (payload: any) => apiRequest('/api/delivery-notes/', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id: string | number, payload: any) => apiRequest(`/api/delivery-notes/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) }),
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
