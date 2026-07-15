import React, { useState, useEffect } from 'react';
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
import { api } from '../lib/api';

export function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.dashboardSummary()
      .then(res => {
        setData(res);
      })
      .catch(err => {
        console.error("Failed to load dashboard overview:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <p className="text-on-surface-variant font-medium">Loading dashboard overview...</p>
      </div>
    );
  }

  const kpis = data?.kpis || { active_orders: 0, deliveries: 0, revenue: 0, pending_approvals: 0, clients_count: 0, total_orders: 0 };
  const total_orders = kpis.total_orders || 0;
  const orderData = data?.order_volume || [];
  const statusData = data?.status_data || [];
  const products = data?.top_products || [];
  const needsAttention = data?.needs_attention || [];
  const recentActivity = data?.recent_activity || [];

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
          { label: 'Active Orders', value: kpis.active_orders.toLocaleString(), change: 'Live', icon: ShoppingCart, color: 'text-primary' },
          { label: 'Deliveries', value: kpis.deliveries.toLocaleString(), change: 'Live', icon: Truck, color: 'text-emerald-600' },
          { label: 'Revenue', value: `$${kpis.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, change: 'Total', icon: TrendingUp, color: 'text-green-600' },
          { label: 'Approvals', value: kpis.pending_approvals.toLocaleString(), change: 'Pending', icon: FileCheck, color: 'text-primary-container' },
          { label: 'Clients', value: kpis.clients_count.toLocaleString(), change: 'Active', icon: UsersIcon, color: 'text-primary' },
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
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-600">
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
            {orderData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-on-surface-variant">
                No orders recorded yet.
              </div>
            ) : (
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
                    {orderData.map((entry: any, index: number) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === orderData.length - 1 ? '#144227' : '#14422720'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/30 h-[380px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold">Top products by volume</h3>
            <button className="text-xs font-bold text-primary hover:underline">Export CSV</button>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            {products.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-on-surface-variant">
                No product demand logged.
              </div>
            ) : (
              products.map((p: any) => (
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
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-4 bg-white p-6 rounded-xl shadow-sm border border-outline-variant/30 min-h-[380px] flex flex-col">
          <h3 className="font-bold mb-6">Orders by status</h3>
          <div className="flex-1 relative flex items-center justify-center">
            {statusData.length === 0 ? (
              <div className="text-xs text-on-surface-variant">No order statuses yet.</div>
            ) : (
              <>
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
                      {statusData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold">{total_orders}</span>
                  <span className="text-[10px] text-on-surface-variant font-bold">TOTAL</span>
                </div>
              </>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {statusData.map((s: any) => (
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
            <span className="bg-red-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
              {needsAttention.length} ACTION REQUIRED
            </span>
          </div>
          <div className="flex-1 divide-y divide-outline-variant/20 overflow-y-auto custom-scrollbar">
            {needsAttention.length === 0 ? (
              <div className="p-6 text-center text-xs text-on-surface-variant">
                No items require attention.
              </div>
            ) : (
              needsAttention.map((item: any, i: number) => {
                const IconComponent = item.icon === 'AlertCircle' ? AlertCircle : (item.icon === 'Truck' ? Truck : Clock);
                return (
                  <div key={i} className="p-4 hover:bg-surface-container-low transition-colors flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg bg-surface-container ${item.color}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{item.title}</p>
                        <p className="text-[11px] text-on-surface-variant font-medium">{item.sub}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="xl:col-span-3 bg-white rounded-xl shadow-sm border border-outline-variant/30 flex flex-col">
          <div className="p-4 border-b border-outline-variant/30 bg-surface-container-low/30">
            <h3 className="font-bold">Recent activity</h3>
          </div>
          <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar">
            {recentActivity.length === 0 ? (
              <div className="p-6 text-center text-xs text-on-surface-variant">
                No recent activity logs.
              </div>
            ) : (
              recentActivity.map((act: any, i: number) => (
                <div key={i} className="relative pl-6 pb-2 border-l-2 border-surface-container last:border-0 last:pb-0">
                  <div className={`absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full ${act.color}`} />
                  <p className="text-xs font-bold leading-tight">{act.t}</p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">{act.time} • System</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
