"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package, Handshake, CheckCircle2, ReceiptText, TrendingUp, ChevronRight, PlusCircle, Plus, Leaf, BarChart3, Inbox } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { cn } from '../lib/utils';
import { apiRequest } from '../lib/api';

const iconMap: Record<string, any> = {
  Package,
  Handshake,
  CheckCircle2,
  ReceiptText,
};

const referenceProductImages: Record<string, string> = {
  'Roma Tomatoes': 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYiimUpH1IFm39l3pnZTBX7tbAQR_aWtolqnXVfboxPqr8MJz9pLBe5CILjBLqm6QIz5161fz4Gh7uTafn3uQA1DyPdwhFX7WaRmQSkeRDy2KKPDZ0RGDpPcnCV09hCAdrNsXSzyDpkD27PXewpXBfJ0kb06ODeplODn-tSr2WmbjmcOb78uNKOU2Ow1kGtSp9wtTq1RJbY2ROo9SLCKoBXXoRYNi0fF7q1_-pLo9QpQlnjxNmUM8CXA',
  'Durum Wheat': 'https://lh3.googleusercontent.com/aida-public/AB6AXuBQYDniTVJvGnzcOZnyoyxdN10cAwuEDsM40zmbtxaMxe-Rvogvt5wvb9isBj_wDgTwDpTojDHf4_jCBFklPVWrjYvfN_P3fJ0uiFJJfs45K8-8K-IVMVCnt8QYgGExTonLEOjHe2AW3QDPkQksQZ3lZqYalgm1LOKScCsbjMko35cjhlcD8Gxb8Ro0-cQtY2h5VTWfYtT8iwBiVUlaDv-u8L-Bn2f_JBmIhRcuWdQUEjU8Qqkl6ZSA0w',
  'Iceberg Lettuce': 'https://lh3.googleusercontent.com/aida-public/AB6AXuBxaIEjUGtnGXLWgWM3dQ4i0tAvOfi7RKZLGu1fGEtWVK3e05aLGKP6QyWo87_ktHPD6eeGJE0IdMO3UIr8r1xbyzKJfapEyuokusuq4sIrAitDQp5plyNJ55e8qI6GFvfmkIu88U-hcSoIGPKI245Pcr01LUYzqaqmqv4UirXitG5XKKi07SQy_JyALKzIO_wYp8GWfZTo03pmxEI5swE3ZsUPP8o2M0LbY1lhw4Qlvi2itb3_dVKCxg',
  'Russet Potatoes': 'https://lh3.googleusercontent.com/aida-public/AB6AXuB41-Vuzo9PoiMU_6JQZOXCKOLW-1IS1IInscIbXRMORY7tTrv44rIvtwhrnsLhdCuonKVd7FwSgRhoTZC4E-PnVFrYOHSFAPKKBNcd8APsOv64N3UUjF53XLXomgCACC8eAwykUHfBJfNjc8JnaM4CdDIUrDyDqE3Cu4KSlEs-hs6Wza1utfBiwoQRKnhnotV-b6enuBmfjpUJYSxR-5Bb5guV7pLUip6Uo16gWDhndBPdCrBjHVsYSw',
};

// ─── Skeletons ────────────────────────────────────────────────────────────────
function KpiSkeleton() {
  return (
    <div className="bg-white border border-outline-variant rounded-xl p-4 space-y-4 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="w-9 h-9 rounded-lg bg-surface-container-high" />
        <div className="w-12 h-4 rounded-full bg-surface-container-high" />
      </div>
      <div className="space-y-2 mt-3">
        <div className="h-3 w-24 bg-surface-container-high rounded" />
        <div className="h-7 w-16 bg-surface-container-high rounded" />
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="animate-pulse space-y-3 h-full flex flex-col">
      <div className="flex justify-between">
        <div className="h-3 w-32 bg-surface-container-high rounded" />
        <div className="h-6 w-24 bg-surface-container-high rounded-lg" />
      </div>
      <div className="flex-1 flex items-end gap-2 pt-4">
        {[40, 65, 50, 80, 60, 90].map((h, i) => (
          <div key={i} className="flex-1 bg-surface-container-high rounded-t-md" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

function DemandCardSkeleton() {
  return (
    <div className="min-w-[230px] bg-white border border-outline-variant rounded-xl overflow-hidden animate-pulse shrink-0">
      <div className="h-32 bg-surface-container-high" />
      <div className="p-3 space-y-2">
        <div className="h-4 w-28 bg-surface-container-high rounded" />
        <div className="h-3 w-20 bg-surface-container-high rounded" />
        <div className="h-8 w-full bg-surface-container-high rounded-xl mt-3" />
      </div>
    </div>
  );
}

// ─── Empty states ─────────────────────────────────────────────────────────────
function EmptyChart({ label }: { label: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-3 text-center py-8">
      <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center">
        <BarChart3 size={24} className="text-outline" />
      </div>
      <p className="font-sans text-sm font-bold text-on-surface-variant">{label}</p>
      <p className="font-sans text-xs text-on-surface-variant/70 max-w-[180px]">Submit your first harvest to start seeing data here.</p>
    </div>
  );
}

function EmptyDemands() {
  return (
    <div className="w-full flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center">
        <Inbox size={28} className="text-outline" />
      </div>
      <p className="font-sans text-sm font-bold text-on-surface">No active demands right now</p>
      <p className="font-sans text-xs text-on-surface-variant max-w-[240px]">Harvest Hill hasn't posted any current demands. Check back soon — new requests are added regularly.</p>
    </div>
  );
}

// ─── KPI card styles ──────────────────────────────────────────────────────────
type KpiStyle = {
  card: string;
  iconWrap: string;
  icon: string;
  badge?: string;
  label: string;
  value: string;
  unit?: string;
  ringTrack?: string;
  ringFill?: string;
  trend?: string;
};

const kpiStyles: KpiStyle[] = [
  {
    card: 'bg-white border-[#c1c9c0]',
    iconWrap: 'bg-[#b6edc2]',
    icon: 'text-[#144227]',
    label: 'text-[#414942]',
    value: 'text-[#1c1c18]',
    unit: 'text-[#414942]',
    trend: 'text-[#376847]',
  },
  {
    card: 'bg-white border-[#c1c9c0]',
    iconWrap: 'bg-[#ffdcc5]',
    icon: 'text-[#563113]',
    badge: 'bg-[#704727] text-[#f1b88f]',
    label: 'text-[#414942]',
    value: 'text-[#1c1c18]',
    unit: 'text-[#563113]',
  },
  {
    card: 'bg-white border-[#c1c9c0]',
    ringTrack: '#e5e2db',
    ringFill: '#376847',
    iconWrap: '',
    icon: '',
    label: 'text-[#414942]',
    value: 'text-[#1c1c18]',
    unit: 'text-[#414942]',
  },
  {
    card: 'bg-[#2d5a3d] border-[#144227]',
    iconWrap: 'bg-white/10',
    icon: 'text-white',
    label: 'text-[#b6edc2]/80',
    value: 'text-[#b6edc2]',
    unit: 'text-[#b6edc2]/80',
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Dashboard({ onViewChange }: { onViewChange?: (view: any) => void }) {
  const [isLoading, setIsLoading] = useState(true);
  const [kpis, setKpis] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const [demands, setDemands] = useState<any[]>([]);
  const [farmName, setFarmName] = useState('');
  const [range, setRange] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.sessionStorage.getItem('dashboard_graph_range') || 'Last 6 months';
    }
    return 'Last 6 months';
  });

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        // Load all in parallel
        const [summary, volume, categories, neededProducts, profileData] = await Promise.all([
          apiRequest('/api/farmer/dashboard/summary/'),
          apiRequest(`/api/farmer/dashboard/supply-volume/?range=${range === 'Last year' ? 'year' : '6months'}`),
          apiRequest('/api/farmer/dashboard/earnings-by-category/'),
          apiRequest('/api/products/?is_currently_needed=true'),
          apiRequest('/api/accounts/me/').catch(() => null),
        ]);

        // acceptance rate number for the ring
        const rateStr = summary.acceptance_rate || '0%';
        const rateNum = parseInt(rateStr) || 0;

        setKpis([
          {
            label: 'Supplies this month',
            value: summary.supplies_this_month ?? 0,
            unit: 'submissions',
            trend: summary.supplies_this_month > 0 ? 'Active' : null,
            icon: 'Package',
          },
          {
            label: 'Pending negotiations',
            value: summary.pending_negotiations ?? 0,
            unit: 'contracts',
            status: summary.pending_negotiations > 0 ? 'Action Needed' : null,
            icon: 'Handshake',
          },
          {
            label: 'Acceptance rate',
            value: rateStr,
            rateNum,
            icon: 'CheckCircle2',
          },
          {
            label: 'Earnings this month',
            value: summary.total_earnings ?? '$0.00',
            icon: 'ReceiptText',
          },
        ]);

        // Chart data
        const hasChartData = Array.isArray(volume) && volume.some((v: any) => v.volume > 0);
        setChartData(hasChartData ? volume : []);

        // Pie
        const hasEarnings = Array.isArray(categories) && categories.some((c: any) => c.value > 0);
        setPieData(hasEarnings ? categories : []);

        // Demands
        setDemands(Array.isArray(neededProducts) ? neededProducts : []);

        // Farm name
        if (profileData?.farmer_profile?.farm_name) {
          setFarmName(profileData.farmer_profile.farm_name);
        } else if (profileData?.username) {
          setFarmName(profileData.username);
        }

      } catch (err) {
        console.error('Dashboard load error:', err);
        // Graceful fallbacks
        setKpis([
          { label: 'Supplies this month', value: '–', unit: 'submissions', icon: 'Package' },
          { label: 'Pending negotiations', value: '–', unit: 'contracts', icon: 'Handshake' },
          { label: 'Acceptance rate', value: '–', rateNum: 0, icon: 'CheckCircle2' },
          { label: 'Earnings this month', value: '–', icon: 'ReceiptText' },
        ]);
        setChartData([]);
        setPieData([]);
        setDemands([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [range]);

  const totalEarningsVal = kpis[3]?.value || '–';
  const rateNum = kpis[2]?.rateNum ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 space-y-6 sm:space-y-8"
    >
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="font-sans text-xl sm:text-2xl font-extrabold text-on-surface">
            {farmName ? `Welcome back, ${farmName}` : 'Welcome back'}
          </h1>
          <p className="font-sans text-xs sm:text-sm text-on-surface-variant mt-1">{today}</p>
        </div>
        <button
          onClick={() => onViewChange?.('submit')}
          className="bg-[#144227] text-white font-mono text-xs px-5 py-2.5 rounded-xl hover:opacity-90 transition-all flex items-center gap-2 shadow-lg active:scale-95 w-full sm:w-auto justify-center cursor-pointer"
        >
          <Plus size={16} />
          Quick Harvest Submission
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
          : kpis.map((kpi, i) => {
              const Icon = iconMap[kpi.icon];
              const styles = kpiStyles[i] ?? kpiStyles[0];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08 }}
                  className={cn(
                    'custom-shadow p-3 sm:p-4 rounded-xl flex flex-col justify-between border min-w-0',
                    styles.card
                  )}
                >
                  {i === 2 ? (
                    /* Acceptance rate ring */
                    <div className="flex items-center gap-3 sm:gap-4 min-h-[100px]">
                      <div
                        className="relative shrink-0 w-14 h-14 rounded-full"
                        style={{
                          background: `conic-gradient(${styles.ringFill ?? '#376847'} 0 ${rateNum}%, ${styles.ringTrack ?? '#e5e2db'} ${rateNum}% 100%)`,
                        }}
                      >
                        <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
                          <span className="font-mono text-[10px] font-bold text-[#1c1c18]">{kpi.value}</span>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className={cn('font-mono text-[8px] sm:text-[10px] uppercase tracking-wider', styles.label)}>{kpi.label}</p>
                        <p className={cn('font-sans text-sm font-bold mt-1', styles.value)}>
                          {rateNum >= 80 ? 'Excellent' : rateNum >= 50 ? 'Good' : 'Improving'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start">
                        <div className={cn('p-1.5 sm:p-2 rounded-lg', styles.iconWrap)}>
                          <Icon size={16} className={cn('sm:w-5 sm:h-5', styles.icon)} />
                        </div>
                        {kpi.trend && (
                          <span className={cn('font-mono text-[10px] font-bold flex items-center gap-0.5', styles.trend ?? 'text-[#376847]')}>
                            <TrendingUp size={12} />
                            {kpi.trend}
                          </span>
                        )}
                        {kpi.status && (
                          <span className={cn('px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full font-mono text-[8px] sm:text-[9px] uppercase tracking-wider', styles.badge)}>
                            {kpi.status}
                          </span>
                        )}
                      </div>
                      <div className="mt-3">
                        <p className={cn('font-mono text-[8px] sm:text-[10px] uppercase tracking-wider', styles.label)}>{kpi.label}</p>
                        <p className={cn('font-sans text-base sm:text-lg lg:text-xl font-bold mt-0.5', styles.value)}>
                          {kpi.value}{' '}
                          {kpi.unit && <span className={cn('text-[9px] sm:text-xs font-normal', styles.unit)}>{kpi.unit}</span>}
                        </p>
                      </div>
                    </>
                  )}
                </motion.div>
              );
            })}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Bar Chart */}
        <div className="md:col-span-2 bg-surface-container-lowest custom-shadow p-4 sm:p-5 rounded-xl border border-outline-variant min-w-0">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Supply volume over time
            </h3>
            <select
              value={range}
              onChange={e => {
                const val = e.target.value;
                setRange(val);
                if (typeof window !== 'undefined') {
                  window.sessionStorage.setItem('dashboard_graph_range', val);
                }
              }}
              className="bg-surface-container-low border-none rounded-lg font-mono text-[10px] px-3 py-1 focus:ring-primary cursor-pointer outline-none"
            >
              <option>Last 6 months</option>
              <option>Last year</option>
            </select>
          </div>
          <div className="h-48 sm:h-56 w-full">
            {isLoading ? (
              <ChartSkeleton />
            ) : chartData.length === 0 ? (
              <EmptyChart label="No supply volume yet" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E2DB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#414942', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: 'rgba(20,66,39,0.05)' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontFamily: 'JetBrains Mono', fontSize: 11 }}
                  />
                  <Bar dataKey="volume" radius={[6, 6, 0, 0]}>
                    {chartData.map((_, index) => (
                      <Cell key={index} fill={index === chartData.length - 1 ? '#144227' : '#B6EDC2'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-surface-container-lowest custom-shadow p-4 sm:p-5 rounded-xl border border-outline-variant flex flex-col min-w-0">
          <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-5">
            Earnings by category
          </h3>
          {isLoading ? (
            <div className="flex-1 animate-pulse flex items-center justify-center">
              <div className="w-32 h-32 rounded-full border-8 border-surface-container-high" />
            </div>
          ) : pieData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-6">
              <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center">
                <Leaf size={20} className="text-outline" />
              </div>
              <p className="font-sans text-xs font-bold text-on-surface-variant">No earnings yet</p>
              <p className="font-sans text-[10px] text-on-surface-variant/60">Paid invoices will appear here once processed.</p>
            </div>
          ) : (
            <>
              <div className="flex-grow flex items-center justify-center relative h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={56} outerRadius={76} paddingAngle={5} dataKey="value">
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="font-sans text-lg font-bold text-on-surface">{totalEarningsVal}</p>
                  <p className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider">Total</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {pieData.map(item => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="font-sans text-xs text-on-surface">{item.name}</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-on-surface">{item.value}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Products Needed ── */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4">
          <h3 className="font-sans text-base sm:text-lg font-bold text-on-surface">Products currently needed</h3>
          <button
            onClick={() => onViewChange?.('submit')}
            className="text-primary font-mono text-xs flex items-center gap-1 hover:underline cursor-pointer"
          >
            View market trends
            <ChevronRight size={14} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
            {[1, 2, 3].map(i => <DemandCardSkeleton key={i} />)}
          </div>
        ) : demands.length === 0 ? (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl custom-shadow">
            <EmptyDemands />
          </div>
        ) : (
          <div className="flex overflow-x-auto gap-3 sm:gap-4 pb-4 custom-scrollbar">
            {demands.map(demand => (
              <motion.div
                key={demand.id}
                whileHover={{ y: -4 }}
                onClick={() => onViewChange?.('submit')}
                className="min-w-[230px] bg-surface-container-lowest custom-shadow rounded-xl overflow-hidden border border-outline-variant group cursor-pointer shrink-0"
              >
                <div className="h-32 overflow-hidden relative">
                  <img
                    src={demand.image_url || demand.image || referenceProductImages[demand.name] || ''}
                    alt={demand.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2.5 right-2.5">
                    <span className={cn(
                      'px-2 py-1 rounded-lg font-mono text-[9px] uppercase tracking-wider shadow-sm',
                      demand.urgency === 'high'
                        ? 'bg-error-container text-on-error-container'
                        : 'bg-secondary-container text-on-secondary-container'
                    )}>
                      {demand.urgency === 'high' ? 'High Demand' : 'Steady Demand'}
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  <h4 className="font-sans text-sm font-bold text-on-surface">{demand.name}</h4>
                  <p className="font-sans text-xs text-on-surface-variant mt-0.5">
                    Need: {demand.quantity_needed} {demand.unit}
                  </p>
                  <button
                    onClick={e => { e.stopPropagation(); onViewChange?.('submit'); }}
                    className="w-full mt-3 py-1.5 bg-surface-container text-primary font-mono text-[10px] font-bold rounded-xl hover:bg-primary hover:text-on-primary transition-all active:scale-95 cursor-pointer"
                  >
                    Submit Harvest
                  </button>
                </div>
              </motion.div>
            ))}
            <div
              onClick={() => onViewChange?.('submit')}
              className="min-w-[110px] shrink-0 flex items-center justify-center border-2 border-dashed border-outline-variant rounded-xl group hover:border-primary transition-colors cursor-pointer"
            >
              <div className="text-center">
                <PlusCircle size={26} className="mx-auto text-on-surface-variant group-hover:text-primary transition-colors" />
                <p className="font-mono text-[10px] mt-2 text-on-surface-variant uppercase tracking-wider group-hover:text-primary">See all</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
