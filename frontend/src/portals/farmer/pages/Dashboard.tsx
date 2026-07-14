"use client";

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Package, Handshake, CheckCircle2, ReceiptText, TrendingUp, ChevronRight, PlusCircle, Plus } from 'lucide-react';
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
  'Roma Tomatoes':
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAYiimUpH1IFm39l3pnZTBX7tbAQR_aWtolqnXVfboxPqr8MJz9pLBe5CILjBLqm6QIz5161fz4Gh7uTafn3uQA1DyPdwhFX7WaRmQSkeRDy2KKPDZ0RGDpPcnCV09hCAdrNsXSzyDpkD27PXewpXBfJ0kb06ODeplODn-tSr2WmbjmcOb78uNKOU2Ow1kGtSp9wtTq1RJbY2ROo9SLCKoBXXoRYNi0fF7q1_-pLo9QpQlnjxNmUM8CXA',
  'Durum Wheat':
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBQYDniTVJvGnzcOZnyoyxdN10cAwuEDsM40zmbtxaMxe-Rvogvt5wvb9isBj_wDgTwDpTojDHf4_jCBFklPVWrjYvfN_P3fJ0uiFJJfs45K8-8K-IVMVCnt8QYgGExTonLEOjHe2AW3QDPkQksQZ3lZqYalgm1LOKScCsbjMko35cjhlcD8Gxb8Ro0-cQtY2h5VTWfYtT8iwBiVUlaDv-u8L-Bn2f_JBmIhRcuWdQUEjU8Qqkl6ZSA0w',
  'Iceberg Lettuce':
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBxaIEjUGtnGXLWgWM3dQ4i0tAvOfi7RKZLGu1fGEtWVK3e05aLGKP6QyWo87_ktHPD6eeGJE0IdMO3UIr8r1xbyzKJfapEyuokusuq4sIrAitDQp5plyNJ55e8qI6GFvfmkIu88U-hcSoIGPKI245Pcr01LUYzqaqmqv4UirXitG5XKKi07SQy_JyALKzIO_wYp8GWfZTo03pmxEI5swE3ZsUPP8o2M0LbY1lhw4Qlvi2itb3_dVKCxg',
  'Russet Potatoes':
    'https://lh3.googleusercontent.com/aida-public/AB6AXuB41-Vuzo9PoiMU_6JQZOXCKOLW-1IS1IInscIbXRMORY7tTrv44rIvtwhrnsLhdCuonKVd7FwSgRhoTZC4E-PnVFrYOHSFAPKKBNcd8APsOv64N3UUjF53XLXomgCACC8eAwykUHfBJfNjc8JnaM4CdDIUrDyDqE3Cu4KSlEs-hs6Wza1utfBiwoQRKnhnotV-b6enuBmfjpUJYSxR-5Bb5guV7pLUip6Uo16gWDhndBPdCrBjHVsYSw',
};

type KpiStyle = {
  card: string;
  iconWrap?: string;
  icon?: string;
  badge?: string;
  label: string;
  value: string;
  unit?: string;
  ringTrack?: string;
  ringFill?: string;
};

const kpiStyles: KpiStyle[] = [
  {
    card: 'bg-[#ffffff] border-[#c1c9c0]',
    iconWrap: 'bg-[#b6edc2]',
    icon: 'text-[#144227]',
    label: 'text-[#414942]',
    value: 'text-[#1c1c18]',
    unit: 'text-[#414942]',
  },
  {
    card: 'bg-[#ffffff] border-[#c1c9c0]',
    iconWrap: 'bg-[#ffdcc5]',
    icon: 'text-[#563113]',
    badge: 'bg-[#704727] text-[#f1b88f]',
    label: 'text-[#414942]',
    value: 'text-[#1c1c18]',
    unit: 'text-[#563113]',
  },
  {
    card: 'bg-[#ffffff] border-[#c1c9c0]',
    ringTrack: '#e5e2db',
    ringFill: '#376847',
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
] as const;

export default function Dashboard({ onViewChange }: { onViewChange?: (view: any) => void }) {
  const [kpis, setKpis] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const [demands, setDemands] = useState<any[]>([]);
  const [range, setRange] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.sessionStorage.getItem('dashboard_graph_range') || 'Last 6 months';
    }
    return 'Last 6 months';
  });

  const data6Months = [
    { name: 'May', volume: 45 },
    { name: 'Jun', volume: 60 },
    { name: 'Jul', volume: 55 },
    { name: 'Aug', volume: 80 },
    { name: 'Sep', volume: 70 },
    { name: 'Oct', volume: 90 },
  ];

  const data12Months = [
    { name: 'Nov', volume: 30 },
    { name: 'Dec', volume: 40 },
    { name: 'Jan', volume: 35 },
    { name: 'Feb', volume: 50 },
    { name: 'Mar', volume: 45 },
    { name: 'Apr', volume: 55 },
    { name: 'May', volume: 45 },
    { name: 'Jun', volume: 60 },
    { name: 'Jul', volume: 55 },
    { name: 'Aug', volume: 80 },
    { name: 'Sep', volume: 70 },
    { name: 'Oct', volume: 90 },
  ];

  useEffect(() => {
    async function loadData() {
      try {
        const summary = await apiRequest("/api/farmer/dashboard/summary/");
        setKpis([
          { label: 'Supplies this month', value: summary.supplies_this_month, unit: 'units', trend: '+5%', icon: 'Package', color: 'primary' },
          { label: 'Pending negotiations', value: summary.pending_negotiations, unit: 'Contracts', status: 'Action Needed', icon: 'Handshake', color: 'tertiary' },
          { label: 'Acceptance rate', value: summary.acceptance_rate, trend: 'High', icon: 'CheckCircle2', color: 'secondary' },
          { label: 'Total earnings this month', value: summary.total_earnings, icon: 'ReceiptText', color: 'primary-container' },
        ]);

        const volumeUrl = `/api/farmer/dashboard/supply-volume/?range=${range === 'Last year' ? 'year' : '6months'}`;
        const volume = await apiRequest(volumeUrl);
        setChartData(volume);

        const categories = await apiRequest("/api/farmer/dashboard/earnings-by-category/");
        setPieData(categories);

        const neededProducts = await apiRequest("/api/products/?is_currently_needed=true");
        setDemands(neededProducts);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
        // Offline Fallbacks
        setKpis([
          { label: 'Supplies this month', value: 428, unit: 'units', trend: '+5%', icon: 'Package', color: 'primary' },
          { label: 'Pending negotiations', value: 3, unit: 'Contracts', status: 'Action Needed', icon: 'Handshake', color: 'tertiary' },
          { label: 'Acceptance rate', value: '94%', trend: 'High', icon: 'CheckCircle2', color: 'secondary' },
          { label: 'Total earnings this month', value: '$4,250.00', icon: 'ReceiptText', color: 'primary-container' },
        ]);
        
        if (range === 'Last year') {
          setChartData(data12Months);
        } else {
          setChartData(data6Months);
        }

        setPieData([
          { name: 'Vegetables', value: 60, color: '#144227' },
          { name: 'Fruits', value: 25, color: '#376847' },
          { name: 'Tubers', value: 15, color: '#563113' },
        ]);
        setDemands([
          { id: '1', name: 'Roma Tomatoes', category: 'Vegetables', image: referenceProductImages['Roma Tomatoes'], price: '$3.45', urgency: 'high', quantity_needed: '2,500', unit: 'kg' },
          { id: '2', name: 'Durum Wheat', category: 'Grains', image: referenceProductImages['Durum Wheat'], price: '$0.85', urgency: 'steady', quantity_needed: '15,000', unit: 'kg' },
          { id: '3', name: 'Iceberg Lettuce', category: 'Vegetables', image: referenceProductImages['Iceberg Lettuce'], price: '$1.20', urgency: 'steady', quantity_needed: '1,200', unit: 'kg' },
          { id: '4', name: 'Russet Potatoes', category: 'Vegetables', image: referenceProductImages['Russet Potatoes'], price: '$0.95', urgency: 'steady', quantity_needed: '4,800', unit: 'kg' },
        ]);
      }
    }
    loadData();
  }, [range]);

  const totalEarningsVal = kpis[3]?.value || "$0.00";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 space-y-6 sm:space-y-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="font-sans text-xl sm:text-2xl font-extrabold text-on-surface">Welcome back, Green Valley Farm</h1>
          <p className="font-sans text-xs sm:text-sm text-on-surface-variant mt-1">Monday, October 23, 2023</p>
        </div>
        <button 
          onClick={() => onViewChange?.('submit')}
          className="bg-[#144227] text-white font-mono text-xs px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl hover:opacity-90 transition-all flex items-center gap-2 shadow-lg active:scale-95 w-full sm:w-auto justify-center cursor-pointer"
        >
          <Plus size={16} />
          Quick Harvest Submission
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {kpis.map((kpi, i) => {
          const Icon = iconMap[kpi.icon];
          const styles = kpiStyles[i] ?? kpiStyles[0];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                'custom-shadow p-2.5 sm:p-4 rounded-xl flex flex-col justify-between border group min-w-0',
                styles.card
              )}
            >
              {i === 2 ? (
                <div className="flex items-center gap-4 sm:gap-5 min-h-[100px] sm:min-h-[120px]">
                  <div
                    className="relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-full"
                    style={{
                      background: `conic-gradient(${styles.ringFill ?? '#3f6f49'} 0 94%, ${styles.ringTrack ?? '#dde4d9'} 94% 100%)`,
                    }}
                  >
                    <div className="absolute inset-2 rounded-full bg-[#ffffff] flex items-center justify-center">
                      <span className="font-mono text-[11px] sm:text-xs font-bold text-[#1c1c18]">94%</span>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className={cn("font-mono text-[8px] sm:text-[10px] uppercase tracking-wider", styles.label)}>{kpi.label}</p>
                    <p className={cn("font-sans text-sm sm:text-base md:text-lg lg:text-xl font-bold mt-0.5 sm:mt-1", styles.value)}>
                      High
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start">
                    <div className={cn("p-1.5 sm:p-2 rounded-lg", styles.iconWrap)}>
                      <Icon size={16} className={cn("sm:w-5 sm:h-5", styles.icon)} />
                    </div>
                    {kpi.trend && (
                      <span className={cn("font-mono text-[10px] sm:text-xs font-bold flex items-center gap-0.5 sm:gap-1", i === 0 ? "text-[#376847]" : "text-[#563113]")}>
                        <TrendingUp size={12} className="sm:w-3.5 sm:h-3.5" />
                        {kpi.trend}
                      </span>
                    )}
                    {kpi.status && (
                      <span className={cn("px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full font-mono text-[8px] sm:text-[10px] uppercase tracking-wider", styles.badge)}>
                        {kpi.status}
                      </span>
                    )}
                  </div>
                  <div className="mt-3">
                    <p className={cn("font-mono text-[8px] sm:text-[10px] uppercase tracking-wider", styles.label)}>{kpi.label}</p>
                    <p className={cn("font-sans text-sm sm:text-base md:text-lg lg:text-xl font-bold mt-0.5 sm:mt-1", styles.value)}>
                      {kpi.value} <span className={cn("text-[8px] sm:text-xs font-normal", styles.unit)}>{kpi.unit}</span>
                    </p>
                  </div>
                </>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="md:col-span-2 lg:col-span-2 bg-surface-container-lowest custom-shadow p-4 sm:p-5 rounded-xl border border-outline-variant min-w-0">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Supply volume over time</h3>
            <select 
              value={range}
              onChange={(e) => {
                const val = e.target.value;
                setRange(val);
                if (typeof window !== 'undefined') {
                  window.sessionStorage.setItem('dashboard_graph_range', val);
                }
              }}
              className="bg-surface-container-low border-none rounded-lg font-mono text-[10px] px-3 py-1 focus:ring-primary cursor-pointer"
            >
              <option>Last 6 months</option>
              <option>Last year</option>
            </select>
          </div>
          <div className="h-44 sm:h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E2DB" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#414942', fontSize: 10, fontFamily: 'JetBrains Mono' }} 
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: 'rgba(20, 66, 39, 0.05)' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="volume" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#144227' : '#B6EDC2'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface-container-lowest custom-shadow p-4 sm:p-5 rounded-xl border border-outline-variant flex flex-col min-w-0">
          <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-6">Earnings by category</h3>
          <div className="flex-grow flex items-center justify-center relative h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="font-sans text-xl font-bold text-on-surface">{totalEarningsVal}</p>
              <p className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider">Total</p>
            </div>
          </div>
          <div className="mt-6 space-y-2">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="font-sans text-xs text-on-surface">{item.name}</span>
                </div>
                <span className="font-mono text-xs font-bold text-on-surface">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

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
        <div className="flex overflow-x-auto gap-3 sm:gap-4 pb-4 custom-scrollbar">
          {demands.map((demand) => (
            <motion.div
              key={demand.id}
              whileHover={{ y: -4 }}
              onClick={() => onViewChange?.('submit')}
              className="min-w-[240px] bg-surface-container-lowest custom-shadow rounded-xl overflow-hidden border border-outline-variant group cursor-pointer"
            >
              <div className="h-32 overflow-hidden relative">
                <img src={referenceProductImages[demand.name] || demand.image} alt={demand.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 right-3">
                  <span className={cn(
                    "px-2 py-1 rounded-lg font-mono text-[10px] uppercase tracking-wider shadow-sm",
                    demand.urgency === 'high' ? "bg-error-container text-on-error-container" : "bg-secondary-container text-on-secondary-container"
                  )}>
                    {demand.urgency === 'high' ? 'High Demand' : 'Steady Demand'}
                  </span>
                </div>
              </div>
              <div className="p-3">
                <h4 className="font-sans text-sm font-bold text-on-surface">{demand.name}</h4>
                <p className="font-sans text-xs text-on-surface-variant mt-1">Need: {demand.quantity_needed} {demand.unit}</p>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewChange?.('submit');
                  }}
                  className="w-full mt-3 py-1.5 bg-surface-container text-primary font-mono text-[10px] font-bold rounded-xl hover:bg-primary hover:text-on-primary transition-all active:scale-95 cursor-pointer"
                >
                  Submit Harvest
                </button>
              </div>
            </motion.div>
          ))}
          <div 
            onClick={() => onViewChange?.('submit')}
            className="min-w-[120px] flex items-center justify-center border-2 border-dashed border-outline-variant rounded-xl group hover:border-primary transition-colors cursor-pointer"
          >
            <div className="text-center">
              <PlusCircle size={28} className="mx-auto text-on-surface-variant group-hover:text-primary transition-colors" />
              <p className="font-mono text-[10px] mt-2 text-on-surface-variant uppercase tracking-wider group-hover:text-primary">See all</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
