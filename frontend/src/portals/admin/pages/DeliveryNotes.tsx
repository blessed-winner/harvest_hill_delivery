import React, { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical, AlertTriangle, MapPin, Truck, FileText, CheckCircle2, Check, ChevronRight } from 'lucide-react';
import { DetailDrawer } from '../components/DetailDrawer';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { api } from '../lib/api';

interface DeliveryNotesProps {
  searchTerm?: string;
}

export function DeliveryNotes({ searchTerm = '' }: DeliveryNotesProps) {
  const [notes, setNotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState('Pending');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  const statusMap: Record<string, string> = {
    'Pending': 'pending',
    'Confirmed': 'confirmed',
    'Disputed': 'discrepancy',
  };

  const loadNotes = () => {
    setIsLoading(true);
    api.deliveryNotes.list()
      .then(res => {
        setNotes(res || []);
      })
      .catch(err => {
        console.error("Failed to load delivery notes:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  const handleUpdateStatus = async (noteId: number | string, newStatus: string) => {
    try {
      await api.deliveryNotes.update(noteId, { status: newStatus });
      setSelectedNote(null);
      loadNotes();
    } catch (err: any) {
      alert(err.message || "Failed to update delivery note status.");
    }
  };

  const getFrontendStatus = (backendStatus: string) => {
    switch (backendStatus) {
      case 'pending': return 'Pending';
      case 'confirmed': return 'Confirmed';
      case 'discrepancy': return 'Disputed';
      default: return backendStatus;
    }
  };

  const filteredNotes = notes.filter(n => {
    const matchesTab = getFrontendStatus(n.status) === activeTab;
    const matchesSearch = searchTerm 
      ? String(n.id).includes(searchTerm) || 
        String(n.order || '').includes(searchTerm) || 
        String(n.supply || '').includes(searchTerm) || 
        n.details.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    return matchesTab && matchesSearch;
  });

  // Pagination calculations
  const notesPerPage = 8;
  const indexOfLastNote = currentPage * notesPerPage;
  const indexOfFirstNote = indexOfLastNote - notesPerPage;
  const currentNotes = filteredNotes.slice(indexOfFirstNote, indexOfLastNote);
  const totalPages = Math.ceil(filteredNotes.length / notesPerPage);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-on-surface">Delivery Notes</h2>
            <p className="text-sm text-on-surface-variant">Manage and monitor product dispatches and client confirmations.</p>
          </div>
        </div>

        <div className="flex border-b border-outline-variant gap-8">
          {['Pending', 'Confirmed', 'Disputed'].map((tab) => {
            const count = notes.filter(n => getFrontendStatus(n.status) === tab).length;
            return (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "pb-3 px-1 border-b-2 font-bold flex items-center gap-2 transition-all cursor-pointer",
                  activeTab === tab 
                    ? "border-primary text-primary" 
                    : "border-transparent text-on-surface-variant hover:text-primary"
                )}
              >
                {tab}
                <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-full">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-outline-variant overflow-hidden flex flex-col justify-between">
        <div className="flex-grow overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-on-surface-variant font-medium animate-pulse">Loading delivery logs...</div>
          ) : filteredNotes.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant font-medium">No notes found.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low border-b border-outline-variant">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Note ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Linked Order</th>
                  <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Details</th>
                  <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {currentNotes.map((note) => (
                  <tr 
                    key={note.id}
                    onClick={() => setSelectedNote(note)}
                    className="hover:bg-surface-container-high/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 font-mono text-sm font-bold">#DLV-{note.id}</td>
                    <td className="px-6 py-4 font-mono text-sm text-primary font-bold">
                      {note.order ? `#ORD-${note.order}` : (note.supply ? `#SUP-${note.supply}` : '—')}
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant truncate max-w-xs">{note.details}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                        note.status === 'discrepancy' ? "bg-red-100 text-red-800" :
                        note.status === 'confirmed' ? "bg-emerald-100 text-emerald-800" :
                        "bg-gray-100 text-gray-800"
                      )}>
                        {getFrontendStatus(note.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ChevronRight className="w-4 h-4 text-outline group-hover:text-primary transition-colors" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {!isLoading && totalPages > 1 && (
          <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant flex items-center justify-between shrink-0">
            <span className="text-xs text-on-surface-variant font-bold">
              Showing {indexOfFirstNote + 1}-{Math.min(indexOfLastNote, filteredNotes.length)} of {filteredNotes.length} logs
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-3 py-1.5 border border-outline-variant rounded-lg text-xs font-bold bg-white text-on-surface-variant hover:bg-surface-container-low transition-all disabled:opacity-50 cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="px-3 py-1.5 border border-outline-variant rounded-lg text-xs font-bold bg-white text-on-surface-variant hover:bg-surface-container-low transition-all disabled:opacity-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <DetailDrawer
        isOpen={!!selectedNote}
        onClose={() => setSelectedNote(null)}
        title={selectedNote ? `Delivery Note #DLV-${selectedNote.id}` : ''}
        subtitle={selectedNote ? `Linked to ${selectedNote.order ? 'Order #ORD-' + selectedNote.order : 'Supply #SUP-' + selectedNote.supply}` : ''}
        footer={
          selectedNote && (
            <div className="flex flex-col gap-3 w-full">
              {selectedNote.status === 'pending' && (
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleUpdateStatus(selectedNote.id, 'confirmed')}
                    className="py-3 bg-primary text-white rounded-lg font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Check className="w-5 h-5" /> Confirm Delivery
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(selectedNote.id, 'discrepancy')}
                    className="py-3 bg-red-600 text-white rounded-lg font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <AlertTriangle className="w-5 h-5" /> Flag Dispute
                  </button>
                </div>
              )}
              <button 
                onClick={() => setSelectedNote(null)}
                className="w-full bg-white border border-outline-variant text-on-surface py-3 rounded-lg font-bold hover:bg-surface-container-high transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          )
        }
      >
        {selectedNote && (
          <div className="space-y-6">
            <div className="bg-surface-container p-4 rounded-xl border border-outline-variant/30">
              <span className="text-[10px] font-bold uppercase text-on-surface-variant tracking-widest block mb-2">Details</span>
              <p className="text-sm font-medium text-on-surface leading-relaxed">
                {selectedNote.details}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/30">
                <span className="text-[10px] font-bold uppercase text-on-surface-variant tracking-widest block mb-1">Created At</span>
                <span className="text-sm font-bold text-primary">{new Date(selectedNote.created_at).toLocaleString()}</span>
              </div>
              <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/30">
                <span className="text-[10px] font-bold uppercase text-on-surface-variant tracking-widest block mb-1">Status</span>
                <span className={cn(
                  "text-xs font-extrabold uppercase",
                  selectedNote.status === 'confirmed' ? "text-green-600" : (selectedNote.status === 'discrepancy' ? "text-red-600" : "text-amber-600")
                )}>
                  {getFrontendStatus(selectedNote.status)}
                </span>
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
