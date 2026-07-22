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
      errMsg = errData.error || errData.detail || JSON.stringify(errData);
    } catch {}
    throw new Error(errMsg);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  // ── Dashboard ──────────────────────────────────────────────────────────────
  dashboardSummary: () => apiRequest('/api/farmer/dashboard/summary/'),
  dashboardSupplyVolume: (range?: string) =>
    apiRequest(`/api/farmer/dashboard/supply-volume/?range=${range === 'Last year' ? 'year' : '6months'}`),
  dashboardEarningsByCategory: () => apiRequest('/api/farmer/dashboard/earnings-by-category/'),

  // ── Products / Demands ─────────────────────────────────────────────────────
  currentDemands: () => apiRequest('/api/products/?is_currently_needed=true'),
  allProducts: () => apiRequest('/api/products/'),

  // ── Supplies ───────────────────────────────────────────────────────────────
  supplies: () => apiRequest('/api/supplies/'),

  submitSupply: (payload: Record<string, any>) => {
    if ((payload.photo && typeof payload.photo !== 'string') || payload.images) {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, val]) => {
        if (val !== null && val !== undefined) {
          if (key === 'images' && Array.isArray(val)) {
            val.forEach(file => {
              formData.append('images', file);
            });
          } else {
            formData.append(key, key === 'photo' ? (val as File) : String(val));
          }
        }
      });
      return apiRequest('/api/supplies/', { method: 'POST', body: formData });
    }
    return apiRequest('/api/supplies/', { method: 'POST', body: JSON.stringify(payload) });
  },

  updateSupply: (supplyId: string | number, payload: Record<string, any>) => {
    if ((payload.photo && typeof payload.photo !== 'string') || payload.images) {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, val]) => {
        if (val !== null && val !== undefined) {
          if (key === 'images' && Array.isArray(val)) {
            val.forEach(file => {
              formData.append('images', file);
            });
          } else {
            formData.append(key, key === 'photo' ? (val as File) : String(val));
          }
        }
      });
      return apiRequest(`/api/supplies/${supplyId}/`, { method: 'PATCH', body: formData });
    }
    return apiRequest(`/api/supplies/${supplyId}/`, { method: 'PATCH', body: JSON.stringify(payload) });
  },

  deleteSupply: (supplyId: string | number) =>
    apiRequest(`/api/supplies/${supplyId}/`, { method: 'DELETE' }),

  // ── Negotiations ───────────────────────────────────────────────────────────
  negotiationThreads: () => apiRequest('/api/negotiations/threads/'),

  sendNegotiationOffer: (threadId: number | string, payload: Record<string, unknown>) =>
    apiRequest(`/api/negotiations/threads/${threadId}/offer/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  acceptNegotiationThread: (threadId: number | string) =>
    apiRequest(`/api/negotiations/threads/${threadId}/accept/`, { method: 'POST' }),

  // ── Invoices ───────────────────────────────────────────────────────────────
  invoices: () => apiRequest('/api/invoices/'),
  invoiceSummary: () => apiRequest('/api/invoiceSummary/'),

  // ── Notifications ─────────────────────────────────────────────────────────
  notifications: () => apiRequest('/api/notifications/'),

  // ── Profile ────────────────────────────────────────────────────────────────
  farmerProfile: async () => {
    const data = await apiRequest('/api/accounts/me/');
    const p = data.profile || {};
    const certArray = p.certifications
      ? p.certifications.split(',').map((c: string) => c.trim())
      : [];
    return {
      farm_name: p.farm_name || '',
      location: p.location || '',
      phone: p.phone || '',
      certifications: certArray,
      certificationsText: certArray.join(', '),
      latitude: p.latitude !== null ? Number(p.latitude) : null,
      longitude: p.longitude !== null ? Number(p.longitude) : null,
      payment_method: p.payment_method || 'AgriBank Savings',
      payment_account_number: p.payment_account_number || '—',
      notify_new_demand: Boolean(p.notify_new_demand),
      notify_negotiation_update: Boolean(p.notify_negotiation_update),
      notify_payment_received: Boolean(p.notify_payment_received),
      user: {
        username: data.username || data.email?.split('@')[0] || '',
        role: data.role,
      },
    };
  },

  updateFarmerProfile: async (payload: any) => {
    const certificationsStr = Array.isArray(payload.certifications)
      ? payload.certifications.join(', ')
      : payload.certifications || '';

    return apiRequest('/api/accounts/me/', {
      method: 'PUT',
      body: JSON.stringify({
        farm_name: payload.farm_name,
        location: payload.location,
        phone: payload.phone,
        certifications: certificationsStr,
        latitude: payload.latitude,
        longitude: payload.longitude,
        notify_new_demand: payload.notify_new_demand,
        notify_negotiation_update: payload.notify_negotiation_update,
        notify_payment_received: payload.notify_payment_received,
      }),
    });
  },
};
