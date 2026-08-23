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
    if (response.status === 401 && token && typeof window !== 'undefined') {
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
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-changed'));
      }
    }
    let errMsg = `Request failed: ${response.status} ${response.statusText}`;
    let errFields: any = null;
    try {
      const errData = await response.json();
      errFields = errData;
      if (errData.errors && typeof errData.errors === 'object') {
        errFields = errData.errors;
        const firstKey = Object.keys(errData.errors)[0];
        const val = errData.errors[firstKey];
        errMsg = Array.isArray(val) ? val[0] : String(val);
      } else if (errData.detail) {
        errMsg = errData.detail;
      } else if (errData.error) {
        errMsg = errData.error;
      } else {
        const keys = Object.keys(errData);
        if (keys.length > 0) {
          const firstKey = keys[0];
          const val = errData[firstKey];
          errMsg = Array.isArray(val) ? val[0] : String(val);
        } else {
          errMsg = JSON.stringify(errData);
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

export const clientApi = {
  // ── Dashboard ──────────────────────────────────────────────────────────────
  dashboardSummary: () => apiRequest('/api/client/dashboard/summary/'),
  volumeByCategory: () => apiRequest('/api/client/dashboard/volume_by_category/'),
  dashboardTopFarmer: () => apiRequest('/api/client/dashboard/top_farmer/'),
  topFarmer: () => apiRequest('/api/client/dashboard/top_farmer/'),
  popularProduct: () => apiRequest('/api/client/dashboard/popular_product/'),

  // ── Supplies / Harvests ───────────────────────────────────────────────────
  supplies: {
    list: (params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiRequest(`/api/supplies/${query}`);
    },
    get: (id: string | number) => apiRequest(`/api/supplies/${id}/`),
  },

  // ── Products / Browsing ────────────────────────────────────────────────────
  products: {
    list: (params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiRequest(`/api/client/products/${query}`);
    },
    get: (id: string | number) => apiRequest(`/api/client/products/${id}/`),
    create: (payload: any) => apiRequest('/api/client/products/', { method: 'POST', body: JSON.stringify(payload) }),
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
    update: (payload: any) => {
      if (payload.avatarFile instanceof File || payload.avatarFile === 'remove') {
        const formData = new FormData();
        if (payload.business_name) formData.append('business_name', payload.business_name);
        if (payload.business_title) formData.append('business_title', payload.business_title);
        if (payload.delivery_address) formData.append('delivery_address', payload.delivery_address);
        if (payload.phone) formData.append('phone', payload.phone);
        if (payload.signature_data !== undefined) formData.append('signature_data', payload.signature_data || '');

        if (payload.avatarFile instanceof File) {
          formData.append('avatar', payload.avatarFile);
        } else if (payload.avatarFile === 'remove') {
          formData.append('avatar', 'remove');
        }

        return apiRequest('/api/accounts/me/', {
          method: 'PUT',
          body: formData,
        });
      }

      return apiRequest('/api/accounts/me/', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },
    delete: () =>
      apiRequest('/api/accounts/me/', {
        method: 'DELETE',
      }),
  },

  // ── Product Requests ───────────────────────────────────────────────────────
  productRequests: {
    list: () => apiRequest('/api/products/requests/'),
    create: (payload: any) =>
      apiRequest('/api/products/requests/', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    update: (id: string | number, payload: any) =>
      apiRequest(`/api/products/requests/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    delete: (id: string | number) =>
      apiRequest(`/api/products/requests/${id}/`, {
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

  // ── System Settings ────────────────────────────────────────────────────────
  systemSettings: {
    get: () => apiRequest('/api/accounts/system-settings/'),
    update: (payload: any) => apiRequest('/api/accounts/system-settings/', { method: 'POST', body: JSON.stringify(payload) }),
  },
};

// Utility functions
export function formatCurrency(value: unknown, fallback = 'RWF 0'): string {
  if (value === null || value === undefined || value === '') return fallback;
  let num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(num)) return fallback;
  if (num > 0 && num < 100) {
    num = Math.round(num * 1473.97);
  }
  return `RWF ${num.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export function getCartStorageKey(): string {
  if (typeof window === 'undefined') return 'cart_items_guest';
  const token = localStorage.getItem('access_token');
  const role = localStorage.getItem('user_role') || 'client';
  const rawEmail = (localStorage.getItem('user_email') || '').trim();
  const rawUsername = (localStorage.getItem('user_username') || '').trim();
  const identifier = rawEmail || rawUsername;

  if (!token || !identifier) {
    return 'cart_items_guest';
  }

  const safeId = identifier.toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `cart_items_${role}_${safeId}`;
}

export function formatOrderNumber(order: any): string {
  if (!order) return '';
  if (typeof order === 'object') {
    if (order.order_number) return order.order_number;
    if (order.orderNumber) return order.orderNumber;
  }
  const idNum = typeof order === 'object' ? Number(order.id) : Number(order);
  if (!isNaN(idNum) && idNum > 0) {
    return idNum > 999999 ? `ORD-${idNum}` : `ORD-${String(idNum).padStart(6, '0')}`;
  }
  return String(typeof order === 'object' ? order.id || '' : order || '');
}

export function formatDeliveryNoteNumber(note: any): string {
  if (!note) return '';
  if (typeof note === 'object') {
    if (note.display_id) return note.display_id;
    if (note.displayId) return note.displayId;
    if (note.delivery_note_number) return note.delivery_note_number;
  }
  const idNum = typeof note === 'object' ? Number(note.id) : Number(note);
  if (!isNaN(idNum) && idNum > 0) {
    return `DLV-${String(idNum).padStart(6, '0')}`;
  }
  const str = String(typeof note === 'object' ? note.id || '' : note || '');
  if (str.startsWith('DLV-')) return str;
  return str ? `DLV-${str}` : '';
}
