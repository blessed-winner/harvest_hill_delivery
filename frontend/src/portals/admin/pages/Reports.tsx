import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { 
  Download, FileText, Filter, Check, MoreVertical 
} from 'lucide-react';
import { DetailDrawer } from './DetailDrawer';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

const farmerData = [
  { name: 'North Cluster', yield: 85, quality: 72 },
  { name: 'Valley Farm', yield: 60, quality: 94 },
  { name: 'River Delta', yield: 45, quality: 88 },
  { name: 'High Plains', yield: 75, quality: 65 },
  { name: 'East Hills', yield: 90, quality: 82 },
  { name: 'Coastal B.', yield: 55, quality: 96 },
];

const rankings = [
  { name: 'John Miller & Sons', region: 'Northern Hills', yield: 428.5, quality: '96.2%', class: 'Class A', perf: 95 },
  { name: 'Green Valley Coop', region: 'Coastal Flats', yield: 392.1, quality: '94.8%', class: 'Class A', perf: 90 },
  { name: 'Blue Pine Orchards', region: 'Eastern Valley', yield: 312.4, quality: '91.5%', class: 'Class B', perf: 82 },
  { name: 'Rolling Hills Dairy', region: 'Northern Hills', yield: 288.9, quality: '89.4%', class: 'Class B', perf: 78 },
];

export function Reports() {
  const [activeReport, setActiveReport] = useState('Farmer Performance');
  const [selectedFarmer, setSelectedFarmer] = useState<any | null>(null);

  return (
    <div className="flex h-full overflow-hidden">
      <div className="w-72 bg-surface-container-low border-r border-outline-variant flex flex-col p-6 overflow-y-auto shrink-0">
        <h2 className="text-xl font-bold text-on-surface mb-6">Report Builder</h2>
        <div className="space-y-6 flex-1">
          <div>
            <label className="text-[10px] font-bold text-on-surface-variant block mb-3 uppercase tracking-widest">Report Type</label>
            <div className="space-y-2">
              {['Sales Analysis', 'Supply Volume', 'Farmer Performance'].map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveReport(type)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-bold border transition-all",
                    activeReport === type 
                      ? "bg-primary-container text-on-primary-container border-primary" 
                      : "bg-white border-outline-variant text-on-surface-variant hover:border-primary"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-on-surface-variant block mb-3 uppercase tracking-widest">Date Range</label>
            <select className="w-full bg-white border border-outline-variant rounded-lg px-4 py-2.5 text-sm font-bold focus:ring-primary">
              <option>Current Harvest (Q3)</option>
              <option>Last 30 Days</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-on-surface-variant block mb-3 uppercase tracking-widest">Filters</label>
            <div className="space-y-4">
              <select className="w-full bg-white border border-outline-variant rounded-lg px-3 py-2 text-xs font-bold">
                <option>All Regions</option>
                <option>Northern Hills</option>
              </select>
              <div className="space-y-2">
                {['Grain & Cereal', 'Fruit & Orchard'].map((cat) => (
                  <label key={cat} className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked className="rounded border-outline-variant text-primary" readOnly />
                    <span className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors">{cat}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
        <button className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:opacity-90 transition-all mt-6">
          Apply Changes
        </button>
      </div>

      <div className="flex-1 bg-background p-8 overflow-y-auto custom-scrollbar">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h3 className="text-2xl font-bold text-on-surface">Farmer Performance Preview</h3>
              <p className="text-sm text-on-surface-variant font-medium mt-1">Analysis of yield metrics and quality benchmarks for Q3 2023.</p>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-outline-variant rounded-lg text-xs font-bold text-primary hover:bg-surface-container-low transition-all">
                <Download className="w-4 h-4" /> Export CSV
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:opacity-90 transition-all">
                <FileText className="w-4 h-4" /> Export PDF
              </button>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-8 bg-white p-6 rounded-xl shadow-sm border border-outline-variant/30">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h4 className="font-bold">Yield vs Quality Benchmark</h4>
                  <p className="text-xs text-on-surface-variant font-medium">Comparison across top performing supplier clusters</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Yield</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-primary/20" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Quality</span>
                  </div>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={farmerData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="yield" fill="#144227" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="quality" fill="#14422730" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-4 grid grid-rows-2 gap-6">
              {[
                { l: 'Global Avg Quality', v: '88.4%', s: '+2.3% vs Q2', c: 'text-primary' },
                { l: 'Total Active Suppliers', v: '1,248', s: '12 new this month', c: 'text-on-surface' },
              ].map((k) => (
                <div key={k.l} className="bg-white p-6 rounded-xl border border-outline-variant/30 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{k.l}</span>
                  <div>
                    <p className="text-3xl font-bold text-on-surface">{k.v}</p>
                    <p className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full inline-block mt-2">{k.s}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="col-span-12 bg-white rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
              <div className="px-6 py-4 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-low/30">
                <h4 className="font-bold">Top Supplier Rankings</h4>
                <button className="text-xs font-bold text-primary hover:underline">View All Suppliers</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-container-low/50">
                    <tr className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                      <th className="px-6 py-3">Farmer Name</th>
                      <th className="px-6 py-3">Region</th>
                      <th className="px-6 py-3">Yield (T)</th>
                      <th className="px-6 py-3 text-right">Performance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {rankings.map((r, i) => (
                      <tr 
                        key={i} 
                        onClick={() => setSelectedFarmer(r)}
                        className="hover:bg-surface-container-high/30 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">
                              {r.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="font-bold">{r.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-on-surface-variant font-medium">{r.region}</td>
                        <td className="px-6 py-4 font-mono font-bold">{r.yield}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-3">
                            <div className="w-32 bg-surface-container-high rounded-full h-1.5">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${r.perf}%` }}
                                className="h-full bg-primary rounded-full" 
                              />
                            </div>
                            <span className="font-bold text-xs">{r.perf}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DetailDrawer
        isOpen={!!selectedFarmer}
        onClose={() => setSelectedFarmer(null)}
        title="Supplier Details"
        subtitle={selectedFarmer?.name}
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setSelectedFarmer(null)} className="px-6 py-2.5 rounded-lg text-sm font-bold text-on-surface-variant hover:bg-surface-container-high">Cancel</button>
            <button className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:opacity-90 transition-all">Save Changes</button>
          </div>
        }
      >
        <div className="space-y-8">
          <section className="space-y-4">
            <h5 className="text-[10px] font-bold text-primary uppercase tracking-widest">Supplier Summary</h5>
            <div className="grid grid-cols-2 gap-4 text-sm font-bold">
              <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30">
                <span className="block text-[9px] text-on-surface-variant uppercase tracking-widest mb-1">Contract ID</span>
                <span className="font-mono">HH-2023-9482</span>
              </div>
              <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30">
                <span className="block text-[9px] text-on-surface-variant uppercase tracking-widest mb-1">Status</span>
                <span className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" /> Active
                </span>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h5 className="text-[10px] font-bold text-primary uppercase tracking-widest">Yield Trends</h5>
            <div className="h-40 w-full bg-surface-container-low rounded-xl flex items-end justify-center gap-2 p-6">
              {[12, 20, 28, 24, 32].map((h, i) => (
                <motion.div 
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: h * 4 }}
                  className="bg-primary/30 w-8 rounded-t hover:bg-primary transition-colors cursor-pointer" 
                />
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h5 className="text-[10px] font-bold text-primary uppercase tracking-widest">Administrative Notes</h5>
            <textarea 
              className="w-full bg-white border border-outline-variant rounded-lg p-4 text-sm font-medium h-32 focus:ring-primary focus:border-primary transition-all"
              placeholder="Add administrative notes about this supplier..."
            />
          </section>
        </div>
      </DetailDrawer>
    </div>
  );
}
