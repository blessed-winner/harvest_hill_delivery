import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { 
  Download, FileText, Filter, Check, MoreVertical, AlertCircle
} from 'lucide-react';
import { DetailDrawer } from '../components/DetailDrawer';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { api } from '../lib/api';

export function Reports() {
  const [activeReport, setActiveReport] = useState('Farmer Performance');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  
  // Dynamic report data from backend
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rankingType, setRankingType] = useState<'supplier' | 'client'>('supplier');

  const loadReportData = () => {
    setIsLoading(true);
    api.reports.get()
      .then(res => {
        setReportData(res);
      })
      .catch(err => {
        console.error("Failed to load report data:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadReportData();
  }, []);

  // Determine active chart data
  const getChartData = () => {
    if (!reportData) return [];
    if (activeReport === 'Sales Analysis') {
      return reportData.salesData || [];
    }
    // Supply Volume / Farmer Performance
    return reportData.farmerData || [];
  };

  const getRankings = () => {
    if (!reportData) return [];
    return rankingType === 'supplier' 
      ? reportData.supplier_rankings || [] 
      : reportData.client_rankings || [];
  };

  const handleExportCSV = () => {
    const data = getRankings();
    if (data.length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    // Header
    csvContent += rankingType === 'supplier' 
      ? "Farmer Name,Region,Yield (T),Quality,Class,Performance %\n"
      : "Client Name,Region,Purchase Volume ($),Completion Rate,Class,Performance %\n";
    
    // Rows
    data.forEach((r: any) => {
      csvContent += `"${r.name}","${r.region}",${r.yield},"${r.quality}","${r.class}",${r.perf}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${rankingType}_rankings_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden bg-[#f9f9f7]">
      <div className="w-72 bg-surface-container-low border-r border-outline-variant flex flex-col p-6 overflow-hidden shrink-0 h-full">
        <h2 className="text-xl font-bold text-on-surface mb-6">Report Builder</h2>
        <div className="space-y-5 flex-1 overflow-hidden">
          <div>
            <label className="text-[10px] font-bold text-on-surface-variant block mb-3 uppercase tracking-widest">Report Type</label>
            <div className="space-y-2">
              {['Sales Analysis', 'Supply Volume', 'Farmer Performance'].map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveReport(type)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-bold border transition-all cursor-pointer",
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
            <select className="w-full bg-white border border-outline-variant rounded-lg px-4 py-2.5 text-sm font-bold focus:ring-primary outline-none cursor-pointer">
              <option>Current Year</option>
              <option>Last 30 Days</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-on-surface-variant block mb-3 uppercase tracking-widest">Filters</label>
            <div className="space-y-4">
              <select className="w-full bg-white border border-outline-variant rounded-lg px-3 py-2 text-xs font-bold outline-none cursor-pointer">
                <option>All Regions</option>
              </select>
            </div>
          </div>
        </div>
        <button 
          onClick={loadReportData}
          className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:opacity-90 transition-all mt-auto cursor-pointer"
        >
          Refresh Data
        </button>
      </div>

      <div className="flex-1 min-w-0 bg-background p-8 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-on-surface-variant font-bold animate-pulse">
            Compiling report data metrics...
          </div>
        ) : (
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex justify-between items-end">
              <div>
                <h3 className="text-2xl font-bold text-on-surface">{activeReport} Preview</h3>
                <p className="text-sm text-on-surface-variant font-medium mt-1">
                  Analysis of live transactions, yields, and performance rankings.
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-outline-variant rounded-lg text-xs font-bold text-primary hover:bg-surface-container-low transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Export CSV
                </button>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-8 bg-white p-6 rounded-xl shadow-sm border border-outline-variant/30">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h4 className="font-bold">{activeReport === 'Sales Analysis' ? 'Category Revenue Distribution' : 'Yield vs Quality Benchmark'}</h4>
                    <p className="text-xs text-on-surface-variant font-medium">Comparison across active categories or suppliers</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm bg-primary" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                        {activeReport === 'Sales Analysis' ? 'Revenue ($)' : 'Yield'}
                      </span>
                    </div>
                    {activeReport !== 'Sales Analysis' && (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-primary/20" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Quality %</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getChartData()}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                      <Tooltip cursor={{ fill: 'transparent' }} />
                      {activeReport === 'Sales Analysis' ? (
                        <Bar dataKey="value" fill="#144227" radius={[2, 2, 0, 0]} />
                      ) : (
                        <>
                          <Bar dataKey="yield" fill="#144227" radius={[2, 2, 0, 0]} />
                          <Bar dataKey="quality" fill="#14422730" radius={[2, 2, 0, 0]} />
                        </>
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-4 grid grid-rows-2 gap-6">
                {[
                  { l: 'Global Avg Quality', v: reportData?.global_stats?.global_avg_quality || '0.0%', s: 'Based on premium grades', c: 'text-primary' },
                  { l: 'Active Network Size', v: `${(reportData?.global_stats?.active_suppliers_count || 0) + (reportData?.global_stats?.active_clients_count || 0)} accounts`, s: `${reportData?.global_stats?.active_suppliers_count || 0} farmers • ${reportData?.global_stats?.active_clients_count || 0} clients`, c: 'text-on-surface' },
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
                <div className="px-6 py-4 border-b border-outline-variant/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-low/30">
                  {/* Rankings Toggle Switcher */}
                  <div className="flex bg-surface-container-low p-1 rounded-xl w-fit">
                    <button 
                      onClick={() => setRankingType('supplier')}
                      className={cn(
                        "px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
                        rankingType === 'supplier' ? "bg-white text-primary shadow-sm" : "text-on-surface-variant hover:bg-surface-container-high"
                      )}
                    >
                      Supplier Rankings
                    </button>
                    <button 
                      onClick={() => setRankingType('client')}
                      className={cn(
                        "px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
                        rankingType === 'client' ? "bg-white text-primary shadow-sm" : "text-on-surface-variant hover:bg-surface-container-high"
                      )}
                    >
                      Client Rankings
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {getRankings().length === 0 ? (
                    <div className="p-8 text-center text-on-surface-variant">
                      <AlertCircle className="w-8 h-8 opacity-40 text-primary mx-auto mb-2" />
                      <p className="text-sm font-bold">No active rankings records found.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead className="bg-surface-container-low/50">
                        <tr className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                          <th className="px-6 py-3">{rankingType === 'supplier' ? 'Farmer Name' : 'Client Name'}</th>
                          <th className="px-6 py-3">Region</th>
                          <th className="px-6 py-3">{rankingType === 'supplier' ? 'Yield (T)' : 'Purchase Volume ($)'}</th>
                          <th className="px-6 py-3 text-right">Performance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10">
                        {getRankings().map((r: any, i: number) => (
                          <tr 
                            key={i} 
                            onClick={() => setSelectedItem(r)}
                            className="hover:bg-surface-container-high/30 transition-colors cursor-pointer group"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">
                                  {r.name.substring(0, 2).toUpperCase()}
                                </div>
                                <span className="font-bold">{r.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-on-surface-variant font-medium">{r.region}</td>
                            <td className="px-6 py-4 font-mono font-bold">
                              {rankingType === 'supplier' ? r.yield : `$${r.yield.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                            </td>
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
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <DetailDrawer
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={rankingType === 'supplier' ? "Supplier Details" : "Client Purchase Details"}
        subtitle={selectedItem?.name}
        footer={
          <div className="flex justify-end gap-3 w-full">
            <button 
              onClick={() => setSelectedItem(null)} 
              className="w-full py-3 border border-outline-variant rounded-lg text-sm font-bold text-on-surface-variant hover:bg-surface-container-high transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        }
      >
        {selectedItem && (
          <div className="space-y-8">
            <section className="space-y-4">
              <h5 className="text-[10px] font-bold text-primary uppercase tracking-widest">
                {rankingType === 'supplier' ? 'Supplier Quality Profile' : 'Client Purchasing Profile'}
              </h5>
              <div className="grid grid-cols-2 gap-4 text-sm font-bold">
                <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30">
                  <span className="block text-[9px] text-on-surface-variant uppercase tracking-widest mb-1">Region</span>
                  <span>{selectedItem.region}</span>
                </div>
                <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant/30">
                  <span className="block text-[9px] text-on-surface-variant uppercase tracking-widest mb-1">Grade Class</span>
                  <span className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" /> {selectedItem.class}
                  </span>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h5 className="text-[10px] font-bold text-primary uppercase tracking-widest">Metrics Benchmark</h5>
              <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/30 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant font-bold">
                    {rankingType === 'supplier' ? 'Total Yield (T)' : 'Total Purchases ($)'}
                  </span>
                  <span className="font-bold">
                    {rankingType === 'supplier' ? selectedItem.yield : `$${selectedItem.yield.toLocaleString()}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant font-bold">
                    {rankingType === 'supplier' ? 'Quality rate' : 'Delivery rate'}
                  </span>
                  <span className="font-bold text-primary">{selectedItem.quality}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant font-bold">Overall Score</span>
                  <span className="font-bold text-secondary">{selectedItem.perf}%</span>
                </div>
              </div>
            </section>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
