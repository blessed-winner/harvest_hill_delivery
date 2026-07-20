import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  Download, FileText, AlertCircle, Printer
} from 'lucide-react';
import { DetailDrawer } from '../components/DetailDrawer';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { api } from '../lib/api';
import { useCurrency } from '../../../context/CurrencyContext';

export function Reports() {
  const [activeReport, setActiveReport] = useState('Farmer Performance');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const { formatPrice, currency } = useCurrency();
  
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rankingType, setRankingType] = useState<'supplier' | 'client'>('supplier');
  const [dateRange, setDateRange] = useState('current_year');

  const printRef = useRef<HTMLDivElement>(null);

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

  const getChartData = () => {
    if (!reportData) return [];
    if (activeReport === 'Sales Analysis') {
      return reportData.salesData || [];
    }
    if (activeReport === 'Supply Volume') {
      return reportData.supplyVolumeData || [];
    }
    return reportData.farmerData || [];
  };

  const getRankings = () => {
    if (!reportData) return [];
    return rankingType === 'supplier' 
      ? reportData.supplier_rankings || [] 
      : reportData.client_rankings || [];
  };

  const handleExportCSV = () => {
    const rankings = getRankings();
    const chartData = getChartData();
    
    let csv = '\uFEFF';
    
    csv += `Harvest Hill — ${activeReport} Report\r\n`;
    csv += `Generated: ${new Date().toLocaleString()}\r\n`;
    csv += `Currency: ${currency}\r\n\r\n`;

    if (activeReport === 'Sales Analysis') {
      csv += `Category Revenue Analysis\r\n`;
      csv += `Category,Revenue (${currency})\r\n`;
      chartData.forEach((d: any) => {
        csv += `"${d.name}","${formatPrice(d.value)}"\r\n`;
      });
    } else {
      csv += `${activeReport} — Yield vs Quality\r\n`;
      csv += `Supplier/Product,Yield (kg/T),Quality %\r\n`;
      chartData.forEach((d: any) => {
        csv += `"${d.name}",${d.yield},${d.quality || 0}%\r\n`;
      });
    }
    
    csv += `\r\n`;

    csv += `${rankingType === 'supplier' ? 'Supplier' : 'Client'} Rankings\r\n`;
    csv += rankingType === 'supplier' 
      ? `Farmer Name,Region,Yield (T),Quality,Class,Performance %\r\n`
      : `Client Name,Region,Purchase Volume (${currency}),Completion Rate,Class,Performance %\r\n`;
    
    rankings.forEach((r: any) => {
      if (rankingType === 'supplier') {
        csv += `"${r.name}","${r.region}",${r.yield},"${r.quality}","${r.class}",${r.perf}%\r\n`;
      } else {
        csv += `"${r.name}","${r.region}","${formatPrice(r.yield)}","${r.quality}","${r.class}",${r.perf}%\r\n`;
      }
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `harvest_hill_${activeReport.toLowerCase().replace(/\s+/g, '_')}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    const rankings = getRankings();
    const chartData = getChartData();

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    const isSales = activeReport === 'Sales Analysis';
    const isSupplier = rankingType === 'supplier';

    let chartRows = '';
    if (isSales) {
      chartData.forEach((d: any) => {
        chartRows += `<tr><td>${d.name}</td><td style="text-align:right">${formatPrice(d.value)}</td></tr>`;
      });
    } else {
      chartData.forEach((d: any) => {
        chartRows += `<tr><td>${d.name}</td><td style="text-align:right">${d.yield}</td><td style="text-align:right">${d.quality || 0}%</td></tr>`;
      });
    }

    let rankingRows = '';
    rankings.forEach((r: any, i: number) => {
      rankingRows += `<tr>
        <td>${i + 1}</td>
        <td>${r.name}</td>
        <td>${r.region}</td>
        <td style="text-align:right">${isSupplier ? r.yield : formatPrice(r.yield)}</td>
        <td>${r.quality}</td>
        <td>${r.class}</td>
        <td style="text-align:right">${r.perf}%</td>
      </tr>`;
    });

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Harvest Hill — ${activeReport} Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1c1c18; padding: 40px; font-size: 12px; }
    .header { border-bottom: 3px solid #144227; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { font-size: 22px; color: #144227; }
    .header p { font-size: 11px; color: #717971; margin-top: 4px; }
    .section { margin-bottom: 28px; }
    .section h2 { font-size: 14px; color: #144227; margin-bottom: 10px; border-bottom: 1px solid #e8e8e5; padding-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #e8e8e5; font-size: 11px; }
    th { background: #f6f3ec; font-weight: 700; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px; color: #414942; }
    tr:nth-child(even) { background: #fafaf8; }
    .stats { display: flex; gap: 16px; margin-bottom: 24px; }
    .stat-box { flex: 1; background: #f6f3ec; padding: 14px; border-radius: 8px; }
    .stat-box .label { font-size: 9px; text-transform: uppercase; color: #717971; font-weight: 700; }
    .stat-box .value { font-size: 20px; font-weight: 800; color: #144227; margin-top: 4px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>Harvest Hill — ${activeReport} Report</h1>
    <p>Generated: ${new Date().toLocaleString()} • Currency: ${currency}</p>
  </div>

  <div class="stats">
    <div class="stat-box">
      <div class="label">Global Avg Quality</div>
      <div class="value">${reportData?.global_stats?.global_avg_quality || '0.0%'}</div>
    </div>
    <div class="stat-box">
      <div class="label">Active Suppliers</div>
      <div class="value">${reportData?.global_stats?.active_suppliers_count || 0}</div>
    </div>
    <div class="stat-box">
      <div class="label">Active Clients</div>
      <div class="value">${reportData?.global_stats?.active_clients_count || 0}</div>
    </div>
  </div>

  <div class="section">
    <h2>${isSales ? 'Category Revenue Analysis' : 'Yield / Supply Analysis'}</h2>
    <table>
      <thead>
        <tr>
          ${isSales
            ? '<th>Category</th><th style="text-align:right">Revenue</th>'
            : '<th>Supplier / Product</th><th style="text-align:right">Yield</th><th style="text-align:right">Quality %</th>'
          }
        </tr>
      </thead>
      <tbody>${chartRows}</tbody>
    </table>
  </div>

  <div class="section">
    <h2>${isSupplier ? 'Supplier Rankings' : 'Client Rankings'}</h2>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>${isSupplier ? 'Farmer Name' : 'Client Name'}</th>
          <th>Region</th>
          <th style="text-align:right">${isSupplier ? 'Yield (T)' : 'Purchase Volume'}</th>
          <th>${isSupplier ? 'Quality' : 'Completion Rate'}</th>
          <th>Class</th>
          <th style="text-align:right">Performance</th>
        </tr>
      </thead>
      <tbody>${rankingRows}</tbody>
    </table>
  </div>
</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 400);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] overflow-hidden bg-[#f9f9f7]">
      <div className="shrink-0 px-6 pt-5 pb-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-[#144227]">Report Builder</h2>
            <p className="text-sm text-[#717971] font-medium mt-0.5">Analysis of live transactions, yields, and performance rankings.</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-[#c1c9c0] rounded-lg text-xs font-bold text-[#144227] hover:bg-[#f6f3ec] transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            <button 
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-[#144227] text-white rounded-lg text-xs font-bold hover:bg-[#1a5533] transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Export PDF
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white border border-[#c1c9c0] rounded-xl p-1 gap-1">
            {['Sales Analysis', 'Supply Volume', 'Farmer Performance'].map((type) => (
              <button
                key={type}
                onClick={() => setActiveReport(type)}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                  activeReport === type 
                    ? "bg-[#144227] text-white shadow-sm" 
                    : "text-[#414942] hover:bg-[#f6f3ec]"
                )}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-[#c1c9c0] hidden sm:block" />

          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 bg-white border border-[#c1c9c0] rounded-lg text-xs font-bold text-[#414942] outline-none cursor-pointer"
          >
            <option value="current_year">Current Year</option>
            <option value="last_30">Last 30 Days</option>
          </select>

          <button 
            onClick={loadReportData}
            className="px-4 py-2 bg-white border border-[#c1c9c0] rounded-lg text-xs font-bold text-[#414942] hover:bg-[#f6f3ec] transition-all cursor-pointer"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6 custom-scrollbar">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-[#717971] font-bold animate-pulse">
            Compiling report data metrics...
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 lg:col-span-8 bg-white p-6 rounded-xl shadow-sm border border-[#e8e8e5]">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="font-bold text-[#1c1c18]">
                      {activeReport === 'Sales Analysis' ? 'Category Revenue Distribution' : 
                       activeReport === 'Supply Volume' ? 'Supply Volume by Product' : 'Farmer Yield & Quality Benchmark'}
                    </h4>
                    <p className="text-xs text-[#717971] font-medium">Comparison across active categories, products, or suppliers</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm bg-[#144227]" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#717971]">
                        {activeReport === 'Sales Analysis' ? `Revenue (${currency})` : 'Yield'}
                      </span>
                    </div>
                    {activeReport === 'Farmer Performance' && (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-[#144227]/20" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#717971]">Quality %</span>
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
                      ) : activeReport === 'Supply Volume' ? (
                        <Bar dataKey="yield" fill="#144227" radius={[2, 2, 0, 0]} />
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
                  { l: 'Global Avg Quality', v: reportData?.global_stats?.global_avg_quality || '0.0%', s: 'Based on premium grades' },
                  { l: 'Active Network Size', v: `${(reportData?.global_stats?.active_suppliers_count || 0) + (reportData?.global_stats?.active_clients_count || 0)} accounts`, s: `${reportData?.global_stats?.active_suppliers_count || 0} farmers • ${reportData?.global_stats?.active_clients_count || 0} clients` },
                ].map((k) => (
                  <div key={k.l} className="bg-white p-6 rounded-xl border border-[#e8e8e5] flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-[#717971] uppercase tracking-widest">{k.l}</span>
                    <div>
                      <p className="text-3xl font-bold text-[#1c1c18]">{k.v}</p>
                      <p className="text-[10px] font-bold text-[#144227] bg-[#144227]/5 px-2 py-0.5 rounded-full inline-block mt-2">{k.s}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="col-span-12 bg-white rounded-xl shadow-sm border border-[#e8e8e5] overflow-hidden">
                <div className="px-6 py-4 border-b border-[#e8e8e5]/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#fafaf8]">
                  <div className="flex bg-[#f0ede6] p-1 rounded-xl w-fit">
                    <button 
                      onClick={() => setRankingType('supplier')}
                      className={cn(
                        "px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
                        rankingType === 'supplier' ? "bg-white text-[#144227] shadow-sm" : "text-[#717971] hover:bg-white/50"
                      )}
                    >
                      Supplier Rankings
                    </button>
                    <button 
                      onClick={() => setRankingType('client')}
                      className={cn(
                        "px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
                        rankingType === 'client' ? "bg-white text-[#144227] shadow-sm" : "text-[#717971] hover:bg-white/50"
                      )}
                    >
                      Client Rankings
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {getRankings().length === 0 ? (
                    <div className="p-8 text-center text-[#717971]">
                      <AlertCircle className="w-8 h-8 opacity-40 text-[#144227] mx-auto mb-2" />
                      <p className="text-sm font-bold">No active rankings records found.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#fafaf8]/50">
                        <tr className="text-[10px] font-bold text-[#717971] uppercase tracking-widest">
                          <th className="px-6 py-3">{rankingType === 'supplier' ? 'Farmer Name' : 'Client Name'}</th>
                          <th className="px-6 py-3">Region</th>
                          <th className="px-6 py-3">{rankingType === 'supplier' ? 'Yield (T)' : `Purchase Volume (${currency})`}</th>
                          <th className="px-6 py-3 text-right">Performance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e8e8e5]/30">
                        {getRankings().map((r: any, i: number) => (
                          <tr 
                            key={i} 
                            onClick={() => setSelectedItem(r)}
                            className="hover:bg-[#fafaf8] transition-colors cursor-pointer group"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#144227]/10 flex items-center justify-center text-[#144227] font-bold text-[10px]">
                                  {r.name.substring(0, 2).toUpperCase()}
                                </div>
                                <span className="font-bold">{r.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-[#717971] font-medium">{r.region}</td>
                            <td className="px-6 py-4 font-mono font-bold">
                              {rankingType === 'supplier' ? r.yield : formatPrice(r.yield)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-3">
                                <div className="w-32 bg-[#e8e8e5] rounded-full h-1.5">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${r.perf}%` }}
                                    className="h-full bg-[#144227] rounded-full" 
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
              className="w-full py-3 border border-[#c1c9c0] rounded-lg text-sm font-bold text-[#717971] hover:bg-[#f6f3ec] transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        }
      >
        {selectedItem && (
          <div className="space-y-8">
            <section className="space-y-4">
              <h5 className="text-[10px] font-bold text-[#144227] uppercase tracking-widest">
                {rankingType === 'supplier' ? 'Supplier Quality Profile' : 'Client Purchasing Profile'}
              </h5>
              <div className="grid grid-cols-2 gap-4 text-sm font-bold">
                <div className="p-4 rounded-lg bg-[#f6f3ec] border border-[#e8e8e5]">
                  <span className="block text-[9px] text-[#717971] uppercase tracking-widest mb-1">Region</span>
                  <span>{selectedItem.region}</span>
                </div>
                <div className="p-4 rounded-lg bg-[#f6f3ec] border border-[#e8e8e5]">
                  <span className="block text-[9px] text-[#717971] uppercase tracking-widest mb-1">Grade Class</span>
                  <span className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" /> {selectedItem.class}
                  </span>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h5 className="text-[10px] font-bold text-[#144227] uppercase tracking-widest">Metrics Benchmark</h5>
              <div className="p-4 bg-[#f6f3ec] rounded-xl border border-[#e8e8e5] space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#717971] font-bold">
                    {rankingType === 'supplier' ? 'Total Yield (T)' : `Total Purchases (${currency})`}
                  </span>
                  <span className="font-bold">
                    {rankingType === 'supplier' ? selectedItem.yield : formatPrice(selectedItem.yield)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#717971] font-bold">
                    {rankingType === 'supplier' ? 'Quality rate' : 'Delivery rate'}
                  </span>
                  <span className="font-bold text-[#144227]">{selectedItem.quality}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#717971] font-bold">Overall Score</span>
                  <span className="font-bold text-[#7c5e2a]">{selectedItem.perf}%</span>
                </div>
              </div>
            </section>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
