export function formatCurrency(value: unknown, fallback = 'RWF 0') {
  if (value === null || value === undefined || value === '') return fallback;
  let num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(num)) return fallback;
  if (num > 0 && num < 100) {
    num = Math.round(num * 1473.97);
  }
  return `RWF ${num.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
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
      window.location.href = '/';
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

export const api = {
  // ── Dashboard ──────────────────────────────────────────────────────────────
  dashboardSummary: () => apiRequest('/api/farmer/dashboard/summary/'),
  dashboardSupplyVolume: (range?: string) =>
    apiRequest(`/api/farmer/dashboard/supply-volume/?range=${range === 'Last year' ? 'year' : '6months'}`),
  dashboardEarningsByCategory: () => apiRequest('/api/farmer/dashboard/earnings-by-category/'),

  // ── Products / Demands ─────────────────────────────────────────────────────
  currentDemands: () => apiRequest('/api/products/?is_currently_needed=true'),
  allProducts: () => apiRequest('/api/products/'),
  clientRequests: () => apiRequest('/api/products/requests/'),

  // ── Supplies ───────────────────────────────────────────────────────────────
  supplies: () => apiRequest('/api/supplies/?my_supplies=true'),

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
  negotiations: {
    deleteOffer: (threadId: string | number, offerId: string | number) =>
      apiRequest(`/api/negotiations/threads/${threadId}/delete-offer/`, {
        method: 'POST',
        body: JSON.stringify({ offer_id: offerId })
      }),
  },
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
      latitude: p.latitude !== null && p.latitude !== undefined ? Number(p.latitude) : null,
      longitude: p.longitude !== null && p.longitude !== undefined ? Number(p.longitude) : null,
      payment_method: p.payment_method || 'MTN Mobile Money (MoMo)',
      payment_account_number: p.payment_account_number || '',
      notify_new_demand: Boolean(p.notify_new_demand),
      notify_negotiation_update: Boolean(p.notify_negotiation_update),
      notify_payment_received: Boolean(p.notify_payment_received),
      avatar: data.avatar || p.avatar || null,
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

    if (payload.avatarFile instanceof File || payload.avatarFile === 'remove') {
      const formData = new FormData();
      formData.append('farm_name', payload.farm_name || '');
      formData.append('location', payload.location || '');
      formData.append('phone', payload.phone || '');
      formData.append('certifications', certificationsStr);
      if (payload.latitude !== null && payload.latitude !== undefined) formData.append('latitude', String(payload.latitude));
      if (payload.longitude !== null && payload.longitude !== undefined) formData.append('longitude', String(payload.longitude));
      formData.append('payment_method', payload.payment_method || '');
      formData.append('payment_account_number', payload.payment_account_number || '');
      formData.append('notify_new_demand', String(Boolean(payload.notify_new_demand)));
      formData.append('notify_negotiation_update', String(Boolean(payload.notify_negotiation_update)));
      formData.append('notify_payment_received', String(Boolean(payload.notify_payment_received)));

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
      body: JSON.stringify({
        farm_name: payload.farm_name,
        location: payload.location,
        phone: payload.phone,
        certifications: certificationsStr,
        latitude: payload.latitude,
        longitude: payload.longitude,
        payment_method: payload.payment_method,
        payment_account_number: payload.payment_account_number,
        notify_new_demand: payload.notify_new_demand,
        notify_negotiation_update: payload.notify_negotiation_update,
        notify_payment_received: payload.notify_payment_received,
      }),
    });
  },
};
