/**
 * Client Portal API Client
 * Handles all API requests for the client portal
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
      window.location.href = '/';
    }
    let errMsg = `Request failed: ${response.status} ${response.statusText}`;
    try {
      const errData = await response.json();
      errMsg = errData.error || errData.detail || JSON.stringify(errData);
    } catch {}
    throw new Error(errMsg);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const clientApi = {
  // ── Dashboard ──────────────────────────────────────────────────────────────
  dashboardSummary: () => apiRequest('/api/client/dashboard/summary/'),
  volumeByCategory: () => apiRequest('/api/client/dashboard/volume_by_category/'),
  dashboardTopFarmer: () => apiRequest('/api/client/dashboard/top_farmer/'),
  topFarmer: () => apiRequest('/api/client/dashboard/top_farmer/'),

  // ── Products / Browsing ────────────────────────────────────────────────────
  products: {
    list: (params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiRequest(`/api/client/products/${query}`);
    },
    get: (id: string | number) => apiRequest(`/api/client/products/${id}/`),
  },

  // ── Orders ─────────────────────────────────────────────────────────────────
  orders: {
    list: (status?: string) => {
      const query = status ? `?status=${status}` : '';
      return apiRequest(`/api/client/orders/${query}`);
    },
    get: (id: string | number) => apiRequest(`/api/client/orders/${id}/`),
    create: (payload: {
      delivery_address: string;
      items: Array<{ product_id: number; quantity: number }>;
    }) => apiRequest('/api/client/orders/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
    update: (id: string | number, payload: any) =>
      apiRequest(`/api/client/orders/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    cancel: (id: string | number) =>
      apiRequest(`/api/client/orders/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'cancelled' }),
      }),
  },

  // ── Delivery Notes ────────────────────────────────────────────────────────
  deliveryNotes: {
    list: () => apiRequest('/api/delivery-notes/'),
    get: (id: string | number) => apiRequest(`/api/delivery-notes/${id}/`),
    create: (payload: any) =>
      apiRequest('/api/delivery-notes/', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    update: (id: string | number, payload: any) =>
      apiRequest(`/api/delivery-notes/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
  },

  // ── Profile ────────────────────────────────────────────────────────────────
  profile: {
    get: () => apiRequest('/api/accounts/me/'),
    update: (payload: any) =>
      apiRequest('/api/accounts/me/', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    delete: () =>
      apiRequest('/api/accounts/me/', {
        method: 'DELETE',
      }),
  },

  // ── Notifications ──────────────────────────────────────────────────────────
  notifications: {
    list: () => apiRequest('/api/notifications/'),
    markRead: (id: string | number) =>
      apiRequest(`/api/notifications/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ is_read: true }),
      }),
    markAllRead: () =>
      apiRequest('/api/notifications/mark-all-read/', { method: 'POST' }),
    delete: (id: string | number) =>
      apiRequest(`/api/notifications/${id}/`, { method: 'DELETE' }),
    deleteAll: () =>
      apiRequest('/api/notifications/delete-all/', { method: 'DELETE' }),
  },
};

// Utility functions
export function formatCurrency(value: unknown, fallback = '$0.00'): string {
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
