import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { 
  ShoppingCart, 
  Truck, 
  TrendingUp, 
  Users as UsersIcon, 
  FileCheck,
  MoreVertical,
  AlertCircle,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';

const orderData = [
  { day: 'MON', value: 700 },
  { day: 'TUE', value: 900 },
  { day: 'WED', value: 850 },
  { day: 'THU', value: 1000 },
  { day: 'FRI', value: 1200 },
  { day: 'SAT', value: 1100 },
  { day: 'SUN', value: 1500 },
];

const statusData = [
  { name: 'Shipped', value: 70, color: '#144227' },
  { name: 'Processing', value: 20, color: '#466551' },
  { name: 'Pending', value: 10, color: '#9ed0ab' },
];

const products = [
  { name: 'Premium Wheat', volume: 2492, percent: 92 },
  { name: 'Organic Corn', volume: 1940, percent: 84 },
  { name: 'Barley Bulk', volume: 1822, percent: 76 },
  { name: 'Soy Seedlings', volume: 1510, percent: 65 },
  { name: 'Fertilizer A', volume: 1204, percent: 52 },
];

export function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-primary">Overview</h2>
        <div className="flex bg-surface-container-low rounded-lg p-1 gap-1">
          {['Today', '7 days', '30 days'].map((t) => (
            <button
              key={t}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                t === 'Today' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:bg-white/50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Active Orders', value: '1,284', change: '+4%', icon: ShoppingCart, color: 'text-primary' },
          { label: 'Deliveries', value: '342', change: '-2%', icon: Truck, color: 'text-emerald-600', isNegative: true },
          { label: 'Revenue', value: '$142.8k', change: '+12%', icon: TrendingUp, color: 'text-green-600' },
          { label: 'Approvals', value: '19', change: 'Stable', icon: FileCheck, color: 'text-primary-container' },
          { label: 'Clients', value: '482', change: '+1.4%', icon: UsersIcon, color: 'text-primary' },
        ].map((kpi, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={kpi.label}
            className="bg-white p-4 rounded-xl shadow-sm border border-outline-variant/30"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{kpi.label}</span>
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold">{kpi.value}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                kpi.isNegative ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
              }`}>
                {kpi.change}
              </span>
            </div>
            <div className="mt-4 h-1 w-full bg-surface-container rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary" 
                style={{ width: `${Math.random() * 40 + 60}%` }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/30 h-[380px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold">Order volume over time</h3>
            <button className="text-on-surface-variant hover:bg-surface-container-low p-1 rounded">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#414942' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#414942' }} 
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(20, 66, 39, 0.05)' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar 
                  dataKey="value" 
                  fill="#144227" 
                  radius={[4, 4, 0, 0]}
                  barSize={32}
                >
                  {orderData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === orderData.length - 1 ? '#144227' : '#14422720'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/30 h-[380px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold">Top 10 products by volume</h3>
            <button className="text-xs font-bold text-primary hover:underline">Export CSV</button>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            {products.map((p) => (
              <div key={p.name} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-bold">{p.name}</span>
                  <span className="font-mono text-on-surface-variant">{p.volume.toLocaleString()}</span>
                </div>
                <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${p.percent}%` }}
                    className="h-full bg-primary"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-4 bg-white p-6 rounded-xl shadow-sm border border-outline-variant/30 min-h-[380px] flex flex-col">
          <h3 className="font-bold mb-6">Orders by status</h3>
          <div className="flex-1 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold">1.2k</span>
              <span className="text-[10px] text-on-surface-variant font-bold">TOTAL</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {statusData.map((s) => (
              <div key={s.name} className="flex flex-col items-center">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-[10px] font-bold truncate">{s.name}</span>
                </div>
                <span className="text-xs font-bold text-on-surface-variant">{s.value}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-5 bg-white rounded-xl shadow-sm border border-outline-variant/30 flex flex-col">
          <div className="p-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low/30">
            <h3 className="font-bold">Needs attention</h3>
            <span className="bg-red-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">5 ACTION REQUIRED</span>
          </div>
          <div className="flex-1 divide-y divide-outline-variant/20 overflow-y-auto custom-scrollbar">
            {[
              { title: 'Pending Order Approval #ORD-4921', sub: 'Customer: Green Valley Farms • $12,400.00', color: 'text-red-500', icon: AlertCircle },
              { title: 'Unconfirmed Delivery Note #DLV-882', sub: 'Awaiting driver signature • 2 hours overdue', color: 'text-emerald-600', icon: Truck },
              { title: 'New Supply Submission: 4 Items', sub: 'From: Midwest Logistics Center • Needs cataloging', color: 'text-primary', icon: Clock },
            ].map((item, i) => (
              <div key={i} className="p-4 hover:bg-surface-container-low transition-colors flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg bg-surface-container ${item.color}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{item.title}</p>
                    <p className="text-[11px] text-on-surface-variant font-medium">{item.sub}</p>
                  </div>
                </div>
                <button className="bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  Review
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-3 bg-white rounded-xl shadow-sm border border-outline-variant/30 flex flex-col">
          <div className="p-4 border-b border-outline-variant/30 bg-surface-container-low/30">
            <h3 className="font-bold">Recent activity</h3>
          </div>
          <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar">
            {[
              { t: 'Order #992 Shipped', time: '2 mins ago', color: 'bg-primary' },
              { t: 'Inventory Restock: Seedlings', time: '45 mins ago', color: 'bg-emerald-600' },
              { t: 'Client Updated: BioGro Inc.', time: '1 hour ago', color: 'bg-outline-variant' },
              { t: 'Delivery Confirmed #DLV-880', time: '3 hours ago', color: 'bg-primary' },
              { t: 'Failed Login Attempt', time: '4 hours ago', color: 'bg-red-600' },
            ].map((act, i) => (
              <div key={i} className="relative pl-6 pb-2 border-l-2 border-surface-container last:border-0 last:pb-0">
                <div className={`absolute left-[-5px] top-0 w-2 h-2 rounded-full ${act.color}`} />
                <p className="text-xs font-bold leading-tight">{act.t}</p>
                <p className="text-[10px] text-on-surface-variant mt-0.5">{act.time} • System</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
