type DashboardSummary = {
  supplies_this_month: number;
  pending_negotiations: number;
  acceptance_rate: string;
  total_earnings: string;
};

type DashboardVolumePoint = { name: string; volume: number };
type CategorySplit = { name: string; value: number; color: string };

type DemandProduct = {
  id: number;
  name: string;
  category: string;
  unit: string;
  base_price: number;
  image: string;
  quantity_needed: number;
  urgency: 'high' | 'steady';
};

type SupplyRecord = {
  id: string;
  product_detail: { name: string; image: string };
  batch: string;
  quantity: string;
  unit: string;
  submitted_at: string;
  status: 'accepted' | 'pending' | 'delivered' | 'negotiating';
  proposed_price: string;
};

type NegotiationOffer = {
  id: number;
  sender: 'farmer' | 'admin';
  price: number;
  quantity: number;
  created_at: string;
};

type NegotiationThread = {
  id: number;
  status: 'open' | 'closed';
  price: string;
  supply_detail: {
    id: number;
    quantity: number;
    unit: string;
    proposed_price: number;
    status: string;
    product_detail: { name: string; image: string; category: string; unit: string };
  };
  offers: NegotiationOffer[];
};

type InvoiceRecord = {
  id: number;
  bikanawe_invoice_id: string;
  supply: number;
  supply_detail: { product_detail?: { name: string }; product?: { name: string } };
  issue_date: string;
  amount: number;
  status: 'PAID' | 'PENDING';
};

type FarmerProfile = {
  farm_name: string;
  location: string;
  certifications: string[];
  payment_method: string;
  payment_account_number: string;
  notify_new_demand: boolean;
  notify_negotiation_update: boolean;
  notify_payment_received: boolean;
  user: {
    username: string;
    role: string;
  };
};

const dashboardSummary: DashboardSummary = {
  supplies_this_month: 428,
  pending_negotiations: 3,
  acceptance_rate: '94%',
  total_earnings: '$4,250.00',
};

const dashboardVolume: DashboardVolumePoint[] = [
  { name: 'May', volume: 45 },
  { name: 'Jun', volume: 60 },
  { name: 'Jul', volume: 55 },
  { name: 'Aug', volume: 80 },
  { name: 'Sep', volume: 70 },
  { name: 'Oct', volume: 90 },
];

const earningsByCategory: CategorySplit[] = [
  { name: 'Vegetables', value: 60, color: '#144227' },
  { name: 'Fruits', value: 25, color: '#376847' },
  { name: 'Tubers', value: 15, color: '#563113' },
];

const demandProducts: DemandProduct[] = [
  {
    id: 1,
    name: 'Roma Tomatoes',
    category: 'Vegetables',
    unit: 'kg',
    base_price: 3.45,
    quantity_needed: 2500,
    urgency: 'high',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA7mLxGJ6xzaHLUCSr_1umm3RMLbPBBRmXCy-4f_ZuaRTdv8VaKWWv9cWdkwxPE5-a8zRrLGWcbVVTS6mDo2Ywdo0ka1FXrHMXqT7WYobgDgxQa1xmPaP7VDuWWhCWKUZ7rBKkzxtd7utEG4zvoLvLwBL8oNwKJ-WOxIBQvhW-CBzfREOH97JRcOTZHikBuwvDXrlultQywcsB7YpLyr3JdRy62v-ei5A2-rhl8Yz8z2PXoZ-FG-q2lg',
  },
  {
    id: 2,
    name: 'Durum Wheat',
    category: 'Grains',
    unit: 'kg',
    base_price: 0.85,
    quantity_needed: 15000,
    urgency: 'steady',
    image:
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 3,
    name: 'Iceberg Lettuce',
    category: 'Vegetables',
    unit: 'kg',
    base_price: 1.2,
    quantity_needed: 1200,
    urgency: 'steady',
    image:
      'https://images.unsplash.com/photo-1566843972142-df0d34f6f1b5?auto=format&fit=crop&q=80&w=800',
  },
  {
    id: 4,
    name: 'Russet Potatoes',
    category: 'Vegetables',
    unit: 'kg',
    base_price: 0.95,
    quantity_needed: 4800,
    urgency: 'steady',
    image:
      'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=800',
  },
];

let supplies: SupplyRecord[] = [
  {
    id: '1',
    product_detail: { name: 'Heirloom Tomatoes', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCRey3ni57-r0mdsoqUUDjHnVzK-ot3jGZRlwrVWdgcfcTfcNBLWLlKAcIA9CueOunIO19QIG1pwBC5ulTFRIYHeThaIS8QZw5X7AFoMWGshdk25Hvxc5CPZDsrXHFuAiiXX8NL1XE6xYpQcUOvZ25DcyOKJscCaZ4TWnprMyVujMqYG5lUz-7rNm9nvTO7eH_vr2p_bOpFx4_g9rnGphbCqQOgj-6PK_2B9dFcJ5ATMmfuuwFpIh8bIg' },
    batch: '#HT-992',
    quantity: '250',
    unit: 'kg',
    submitted_at: '2023-10-12T00:00:00Z',
    status: 'accepted',
    proposed_price: '5.00',
  },
  {
    id: '2',
    product_detail: { name: 'Organic Curly Kale', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA0vrzC0e6TSgZ3qUfQGwi1SBbx1Azxcwej8lQIgygqNPfj4BvtV79fCCiz3w-x380yG1ib7N9s-Ya73fkUbfLZOE-zEgN_zcgc2pQSKpEXEXmR9V3T_7g-8xs_nJgaibWJZ4cEBuiVonvwwxjgYcVeWXp6ZtmLS_t4ddMpkRpSPU_c1xPYGQBucsGiGtfTrkDNum3MTJxPYkOOh3Lei-uvm3sYRIcI_-Lm6Mf44Bo_E_qUSWgE3JbZ4g' },
    batch: '#OK-451',
    quantity: '80',
    unit: 'kg',
    submitted_at: '2023-10-14T00:00:00Z',
    status: 'pending',
    proposed_price: '4.00',
  },
  {
    id: '3',
    product_detail: { name: 'Farm Fresh Eggs', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBxsEs4IhBMq2z7Dc30_bYvToFqv-NONJHBLanc_VQi_40AtymTuKos-Y78p_MkdZ33afM9Uye8vUSh4tvZzk1YdQmTcDeaU3iRByGcMMPLAazHOxd5checkr74FpOjjHQPktyrC_MOlMnmPi7I7ZgiBsDtE9iQC6elk8RdmZ9pQSXxXOpEhlhlgpA-LHzZyv9-8JBtTKm5Nwjqz0IS08MaA5Ef1QluLZ-_sT9llyt-ewd2Z1utcqB9pQ' },
    batch: '#FE-122',
    quantity: '40',
    unit: 'doz',
    submitted_at: '2023-10-15T00:00:00Z',
    status: 'delivered',
    proposed_price: '6.00',
  },
];

let negotiationThreads: NegotiationThread[] = [
  {
    id: 1,
    status: 'open',
    price: '8.50',
    supply_detail: {
      id: 4,
      quantity: 500,
      unit: 'kg',
      proposed_price: 9,
      status: 'negotiating',
      product_detail: {
        name: 'Organic Bing Cherries',
        image:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuCDjW4LDDg9AP70u42NvTwegX0aSJNLRjt9qSwBllNwb_diw_nxtuUDtN-TcdUiA3ivCMjbYnGmgv5-wkvLzRGpmqY8xMZu-ylv5QfnxZlHwCRKBpiG5A8G9Ta0OiugntBsGuXZSmsbtb8KEUNEHV73RMwY1zZYbedheJuxMoFEmJpM5ARItKv04bj7gtmOHuBXHviExa4vDOX-yw21yRwq616WxnlapT2173nuHbJEKQ9VghPugmqtBg',
        category: 'Fruits',
        unit: 'kg',
      },
    },
    offers: [
      { id: 1, sender: 'farmer', price: 9, quantity: 500, created_at: '2023-10-24T10:00:00Z' },
      { id: 2, sender: 'admin', price: 8.2, quantity: 500, created_at: '2023-10-24T10:05:00Z' },
      { id: 3, sender: 'farmer', price: 8.5, quantity: 500, created_at: '2023-10-24T10:10:00Z' },
      { id: 4, sender: 'admin', price: 8.35, quantity: 500, created_at: '2023-10-24T10:15:00Z' },
    ],
  },
];

let invoices: InvoiceRecord[] = [
  {
    id: 1,
    bikanawe_invoice_id: '#HH-INV-2023-001',
    supply: 1,
    supply_detail: { product_detail: { name: 'Premium Organic Fertilizer (Batch A)' } },
    issue_date: '2023-10-28T00:00:00Z',
    amount: 2450,
    status: 'PAID',
  },
  {
    id: 2,
    bikanawe_invoice_id: '#HH-INV-2023-002',
    supply: 2,
    supply_detail: { product_detail: { name: 'Seed Corn High-Yield 50kg Bags' } },
    issue_date: '2023-11-02T00:00:00Z',
    amount: 5790.5,
    status: 'PENDING',
  },
  {
    id: 3,
    bikanawe_invoice_id: '#HH-INV-2023-003',
    supply: 3,
    supply_detail: { product_detail: { name: 'Irrigation System Spare Parts' } },
    issue_date: '2023-11-05T00:00:00Z',
    amount: 1200,
    status: 'PAID',
  },
  {
    id: 4,
    bikanawe_invoice_id: '#HH-INV-2023-004',
    supply: 4,
    supply_detail: { product_detail: { name: 'Greenhouse Temperature Sensors' } },
    issue_date: '2023-11-12T00:00:00Z',
    amount: 850,
    status: 'PENDING',
  },
];

let farmerProfile: FarmerProfile = {
  farm_name: 'Green Valley Organic Farms Ltd.',
  location: '1248 Vineyard Lane, St. Helena, CA',
  certifications: ['USDA Organic', 'Fair Trade'],
  payment_method: 'AgriBank Savings',
  payment_account_number: '**** **** 8829',
  notify_new_demand: true,
  notify_negotiation_update: false,
  notify_payment_received: false,
  user: {
    username: 'green-valley-farm',
    role: 'tier 1',
  },
};

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

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

export async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  const method = (options.method ?? 'GET').toUpperCase();

  switch (true) {
    case endpoint === '/api/farmer/dashboard/summary/' && method === 'GET':
      return clone(dashboardSummary);
    case endpoint === '/api/farmer/dashboard/supply-volume/' && method === 'GET':
      return clone(dashboardVolume);
    case endpoint === '/api/farmer/dashboard/earnings-by-category/' && method === 'GET':
      return clone(earningsByCategory);
    case endpoint === '/api/products/?is_currently_needed=true' && method === 'GET':
      return clone(demandProducts);
    case endpoint === '/api/supplies/' && method === 'GET':
      return clone(supplies);
    case endpoint === '/api/negotiations/threads/' && method === 'GET':
      return clone(negotiationThreads);
    case endpoint.startsWith('/api/negotiations/threads/') && endpoint.endsWith('/offer/') && method === 'POST': {
      const threadId = Number(endpoint.split('/')[4]);
      const body = JSON.parse((options.body as string) || '{}');
      negotiationThreads = negotiationThreads.map((thread) =>
        thread.id === threadId
          ? {
              ...thread,
              offers: [
                ...thread.offers,
                {
                  id: thread.offers.length + 1,
                  sender: 'farmer',
                  price: Number(body.price ?? 0),
                  quantity: Number(body.quantity ?? 0),
                  created_at: new Date().toISOString(),
                },
              ],
            }
          : thread
      );
      return { ok: true };
    }
    case endpoint.startsWith('/api/negotiations/threads/') && endpoint.endsWith('/accept/') && method === 'POST': {
      const threadId = Number(endpoint.split('/')[4]);
      negotiationThreads = negotiationThreads.map((thread) =>
        thread.id === threadId ? { ...thread, status: 'closed' } : thread
      );
      return { ok: true };
    }
    case endpoint === '/api/invoices/' && method === 'GET':
      return clone(invoices);
    case endpoint === '/api/invoices/summary/' && method === 'GET':
      return {
        total_earned: invoices.filter((invoice) => invoice.status === 'PAID').reduce((sum, invoice) => sum + invoice.amount, 0),
        pending: invoices.filter((invoice) => invoice.status === 'PENDING').reduce((sum, invoice) => sum + invoice.amount, 0),
        last_payment: invoices.find((invoice) => invoice.status === 'PAID')?.amount ?? 0,
      };
    case endpoint === '/api/notifications/' && method === 'GET':
      return [
        { id: 1, title: 'Demo data loaded', message: 'No live data source is connected yet.' },
        { id: 2, title: 'Mock store active', message: 'All actions stay local in this frontend.' },
      ];
    case endpoint === '/api/farmer/profile/' && method === 'GET':
      return clone(farmerProfile);
    case endpoint === '/api/farmer/profile/' && method === 'PUT': {
      const body = JSON.parse((options.body as string) || '{}');
      farmerProfile = {
        ...farmerProfile,
        ...body,
        certifications: Array.isArray(body.certifications) ? body.certifications : farmerProfile.certifications,
      };
      return clone(farmerProfile);
    }
    case endpoint === '/api/supplies/' && method === 'POST': {
      const body = JSON.parse((options.body as string) || '{}');
      const productId = Number(body.product ?? 0);
      const matchedProduct = demandProducts.find((product) => product.id === productId);
      const nextSupply: SupplyRecord = {
        id: String(supplies.length + 1),
        product_detail: {
          name: String(body.product_name ?? matchedProduct?.name ?? 'New Harvest'),
          image: String(body.photo ?? matchedProduct?.image ?? demandProducts[0].image),
        },
        batch: `#HH-${String(supplies.length + 1).padStart(3, '0')}`,
        quantity: String(body.quantity ?? ''),
        unit: String(body.unit ?? 'kg'),
        submitted_at: new Date().toISOString(),
        status: 'pending',
        proposed_price: String(body.proposed_price ?? '0.00'),
      };
      supplies = [nextSupply, ...supplies];
      return clone(nextSupply);
    }
    default:
      throw new Error(`Mock API does not handle ${method} ${endpoint}`);
  }
}

export const api = {
  dashboardSummary: () => apiRequest('/api/farmer/dashboard/summary/'),
  dashboardSupplyVolume: () => apiRequest('/api/farmer/dashboard/supply-volume/'),
  dashboardEarningsByCategory: () => apiRequest('/api/farmer/dashboard/earnings-by-category/'),
  currentDemands: () => apiRequest('/api/products/?is_currently_needed=true'),
  supplies: () => apiRequest('/api/supplies/'),
  submitSupply: (payload: Record<string, unknown>) =>
    apiRequest('/api/supplies/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  negotiationThreads: () => apiRequest('/api/negotiations/threads/'),
  sendNegotiationOffer: (threadId: number | string, payload: Record<string, unknown>) =>
    apiRequest(`/api/negotiations/threads/${threadId}/offer/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  acceptNegotiationThread: (threadId: number | string) =>
    apiRequest(`/api/negotiations/threads/${threadId}/accept/`, {
      method: 'POST',
    }),
  invoices: () => apiRequest('/api/invoices/'),
  invoiceSummary: () => apiRequest('/api/invoices/summary/'),
  notifications: () => apiRequest('/api/notifications/'),
  farmerProfile: () => apiRequest('/api/farmer/profile/'),
  updateFarmerProfile: (payload: Record<string, unknown>) =>
    apiRequest('/api/farmer/profile/', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
};
