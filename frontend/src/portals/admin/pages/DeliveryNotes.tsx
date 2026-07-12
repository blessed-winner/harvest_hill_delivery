import React, { useState } from 'react';
import { Search, Plus, MoreVertical, AlertTriangle, MapPin, Truck, FileText, CheckCircle2 } from 'lucide-react';
import { DeliveryNote } from '../types';
import { DetailDrawer } from '../components/DetailDrawer';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

const mockNotes: DeliveryNote[] = [
  { id: 'DN-29482', orderId: '#HH-7721', client: 'Green Fields Market', items: '8 SKUs', date: 'Oct 24, 2023', status: 'Disputed' },
  { id: 'DN-29481', orderId: '#HH-7719', client: 'Organic Life Co.', items: '14 SKUs', date: 'Oct 24, 2023', status: 'Pending' },
  { id: 'DN-29480', orderId: '#HH-7715', client: 'Harvest Bistro', items: '3 SKUs', date: 'Oct 23, 2023', status: 'Confirmed' },
  { id: 'DN-29479', orderId: '#HH-7708', client: 'Sunnyside Markets', items: '21 SKUs', date: 'Oct 23, 2023', status: 'Disputed' },
];

export function DeliveryNotes() {
  const [selectedNote, setSelectedNote] = useState<DeliveryNote | null>(null);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-on-surface">Delivery Notes</h2>
            <p className="text-sm text-on-surface-variant">Manage and monitor product dispatches and client confirmations.</p>
          </div>
          <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-all">
            <Plus className="w-4 h-4" /> Create Note
          </button>
        </div>

        <div className="flex border-b border-outline-variant gap-8">
          <button className="pb-3 px-1 border-b-2 border-primary text-primary font-bold flex items-center gap-2">
            Awaiting Confirmation
            <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-full">12</span>
          </button>
          <button className="pb-3 px-1 border-b-2 border-transparent text-on-surface-variant hover:text-primary font-bold transition-all">
            Confirmed
          </button>
          <button className="pb-3 px-1 border-b-2 border-transparent text-on-surface-variant hover:text-primary font-bold transition-all flex items-center gap-2">
            Disputed
            <span className="bg-red-50 text-white text-[10px] px-1.5 py-0.5 rounded-full">3</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-outline-variant overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-container-low border-b border-outline-variant">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Note ID</th>
              <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Order ID</th>
              <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Client</th>
              <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Items</th>
              <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {mockNotes.map((note) => (
              <tr 
                key={note.id}
                onClick={() => setSelectedNote(note)}
                className="hover:bg-surface-container-high/50 transition-colors cursor-pointer group"
              >
                <td className="px-6 py-4 font-mono text-sm font-bold">{note.id}</td>
                <td className="px-6 py-4 font-mono text-sm text-primary font-bold">{note.orderId}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-primary-container/20 flex items-center justify-center text-[10px] font-bold text-primary">
                      {note.client.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="text-sm font-bold">{note.client}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-on-surface-variant">{note.items}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                    note.status === 'Disputed' ? "bg-red-50 text-red-600" :
                    note.status === 'Confirmed' ? "bg-emerald-50 text-emerald-600" :
                    "bg-gray-100 text-gray-600"
                  )}>
                    {note.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 text-on-surface-variant hover:text-primary rounded-full hover:bg-surface-container-high transition-all">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { l: 'Daily Fulfillment Rate', v: '94.2%', s: '+2.1%', c: 'text-primary' },
          { l: 'Active Disputes', v: '03', s: 'Requires attention', c: 'text-red-600' },
          { l: 'Avg. Confirmation Time', v: '4.2 Hrs', s: 'Across all clients', c: 'text-on-surface' },
        ].map((k) => (
          <div key={k.l} className="bg-surface-container-low p-6 rounded-xl border border-outline-variant flex flex-col justify-between h-32">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{k.l}</span>
            <div className="flex items-end justify-between">
              <span className={`text-3xl font-bold ${k.c}`}>{k.v}</span>
              <span className="text-[10px] font-bold text-on-surface-variant">{k.s}</span>
            </div>
          </div>
        ))}
      </div>

      <DetailDrawer
        isOpen={!!selectedNote}
        onClose={() => setSelectedNote(null)}
        title={selectedNote?.id || ''}
        subtitle={selectedNote ? `Linked to ${selectedNote.orderId} • ${selectedNote.client}` : ''}
        footer={
          <div className="flex flex-col gap-3">
            <button className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:brightness-90 transition-all flex items-center justify-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Flag Dispute
            </button>
            <button className="w-full bg-white border border-outline-variant text-on-surface py-3 rounded-lg font-bold hover:bg-surface-container-high transition-all">
              Contact Dispatcher
            </button>
          </div>
        }
      >
        {selectedNote && (
          <div className="space-y-8">
            <div className="bg-red-50 border border-red-100 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-bold text-[10px] uppercase tracking-wider">Quantity Mismatch Detected</span>
              </div>
              <p className="text-xs text-on-surface-variant">Client reported missing items upon delivery. Review the comparison below.</p>
            </div>

            <section className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase text-on-surface-variant tracking-widest">Item Discrepancies</h4>
              <div className="space-y-3">
                {[
                  { name: 'Organic Hass Avocados', unit: 'Box (12 units)', sent: 20, conf: 15, error: true },
                  { name: 'Red Vine Tomatoes', unit: 'Crate (5kg)', sent: 12, conf: 12 },
                  { name: 'Fresh Baby Spinach', unit: 'Bag (500g)', sent: 50, conf: 42, error: true },
                ].map((item, i) => (
                  <div key={i} className={cn(
                    "flex items-center justify-between p-3 rounded-lg border-l-4",
                    item.error ? "bg-surface-container border-l-red-500" : "bg-surface-container-low border-l-outline-variant"
                  )}>
                    <div>
                      <p className="text-sm font-bold">{item.name}</p>
                      <p className="text-[10px] text-on-surface-variant">{item.unit}</p>
                    </div>
                    <div className="flex gap-4 text-center">
                      <div>
                        <p className="text-[9px] uppercase font-bold text-on-surface-variant">Sent</p>
                        <p className="text-sm font-bold">{item.sent}</p>
                      </div>
                      <div>
                        <p className={cn("text-[9px] uppercase font-bold", item.error ? "text-red-600" : "text-on-surface-variant")}>Conf.</p>
                        <p className={cn("text-sm font-bold", item.error && "text-red-600")}>{item.conf}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase text-on-surface-variant tracking-widest">Logistics Evidence</h4>
              <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden shadow-sm">
                <div className="p-3 border-b border-outline-variant flex justify-between items-center bg-white/50">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Client Signature</span>
                  <span className="text-[9px] text-on-surface-variant font-bold">Oct 24, 09:42 AM</span>
                </div>
                <div className="h-32 flex items-center justify-center bg-white p-4">
                  <div className="relative text-3xl font-mono opacity-10 select-none">
                    Digital Signature Verified
                  </div>
                  <motion.div 
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    className="absolute font-['Homemade_Apple',_cursive] text-2xl italic opacity-80"
                  >
                    Marcus Greene
                  </motion.div>
                </div>
                <div className="p-3 text-[10px] text-on-surface-variant font-bold flex gap-2 items-center">
                  <MapPin className="w-3 h-3 text-primary" />
                  42.3601° N, 71.0589° W (Green Fields Warehouse, Dock B)
                </div>
              </div>
            </section>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
