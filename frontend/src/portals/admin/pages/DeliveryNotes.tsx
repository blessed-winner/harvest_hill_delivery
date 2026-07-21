import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, MoreVertical, AlertTriangle, MapPin, Truck, FileText, 
  CheckCircle2, Check, ChevronRight, Trash2, Archive, CheckSquare, Square 
} from 'lucide-react';
import { DetailDrawer } from '../components/DetailDrawer';
import { cn } from '../lib/utils';
import { api } from '../lib/api';

interface DeliveryNotesProps {
  searchTerm?: string;
}

export function DeliveryNotes({ searchTerm = '' }: DeliveryNotesProps) {
  const [notes, setNotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState('Pending');
  
  // Selection state for bulk operations
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  const loadNotes = () => {
    setIsLoading(true);
    api.deliveryNotes.list()
      .then(res => {
        setNotes(res || []);
        setSelectedIds([]);
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
    setSelectedIds([]);
  }, [activeTab, searchTerm]);

  const getFrontendStatus = (note: any) => {
    if (note.is_archived) return 'Archived';
    switch (note.status) {
      case 'pending': return 'Pending';
      case 'confirmed': return 'Confirmed';
      case 'discrepancy': return 'Disputed';
      default: return note.status;
    }
  };

  const handleUpdateStatus = async (noteId: number | string, newStatus: string) => {
    try {
      await api.deliveryNotes.update(noteId, { status: newStatus });
      setSelectedNote(null);
      loadNotes();
    } catch (err: any) {
      alert(err.message || "Failed to update delivery note status.");
    }
  };

  const handleArchiveNote = async (noteId: number | string, archiveState = true) => {
    try {
      await api.deliveryNotes.update(noteId, { is_archived: archiveState });
      setSelectedNote(null);
      loadNotes();
    } catch (err: any) {
      alert(err.message || "Failed to update archive status.");
    }
  };

  const handleDeleteNote = async (noteId: number | string) => {
    if (!confirm("Are you sure you want to delete this delivery note?")) return;
    try {
      await api.deliveryNotes.delete(noteId);
      setSelectedNote(null);
      loadNotes();
    } catch (err: any) {
      alert(err.message || "Failed to delete delivery note.");
    }
  };

  // Bulk Operations
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected delivery notes?`)) return;
    
    setIsProcessingBulk(true);
    try {
      await Promise.all(selectedIds.map(id => api.deliveryNotes.delete(id)));
      loadNotes();
    } catch (err: any) {
      alert("Error performing bulk deletion. Some items may not have been deleted.");
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleBulkArchive = async (archiveState = true) => {
    if (selectedIds.length === 0) return;
    setIsProcessingBulk(true);
    try {
      await Promise.all(selectedIds.map(id => api.deliveryNotes.update(id, { is_archived: archiveState })));
      loadNotes();
    } catch (err: any) {
      alert("Error performing bulk archive.");
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const filteredNotes = notes.filter(n => {
    const matchesTab = getFrontendStatus(n) === activeTab;
    const matchesSearch = searchTerm 
      ? String(n.id).includes(searchTerm) || 
        String(n.order || '').includes(searchTerm) || 
        String(n.supply || '').includes(searchTerm) || 
        (n.details || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (n.signed_by || '').toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    return matchesTab && matchesSearch;
  });

  // Pagination calculations
  const notesPerPage = 8;
  const indexOfLastNote = currentPage * notesPerPage;
  const indexOfFirstNote = indexOfLastNote - notesPerPage;
  const currentNotes = filteredNotes.slice(indexOfFirstNote, indexOfLastNote);
  const totalPages = Math.ceil(filteredNotes.length / notesPerPage);

  // Selection handlers
  const isAllSelected = currentNotes.length > 0 && currentNotes.every(n => selectedIds.includes(n.id));
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(prev => prev.filter(id => !currentNotes.some(cn => cn.id === id)));
    } else {
      const currentNoteIds = currentNotes.map(n => n.id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...currentNoteIds])));
    }
  };

  const toggleSelectNote = (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-on-surface">Delivery Notes</h2>
            <p className="text-sm text-on-surface-variant">Manage and monitor product dispatches, client confirmations, and disputes.</p>
          </div>

          {/* Bulk Operations Toolbar */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-3 bg-surface-container-high px-4 py-2 rounded-xl border border-outline-variant animate-fadeIn">
              <span className="text-xs font-bold text-primary">{selectedIds.length} Selected</span>
              <div className="w-[1px] h-4 bg-outline-variant" />
              {activeTab !== 'Archived' ? (
                <button
                  onClick={() => handleBulkArchive(true)}
                  disabled={isProcessingBulk}
                  className="px-3 py-1 bg-white border border-outline-variant hover:bg-surface-container-low text-on-surface text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Archive size={14} /> Archive Selected
                </button>
              ) : (
                <button
                  onClick={() => handleBulkArchive(false)}
                  disabled={isProcessingBulk}
                  className="px-3 py-1 bg-white border border-outline-variant hover:bg-surface-container-low text-on-surface text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Archive size={14} /> Unarchive Selected
                </button>
              )}
              <button
                onClick={handleBulkDelete}
                disabled={isProcessingBulk}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
              >
                <Trash2 size={14} /> Delete Selected
              </button>
            </div>
          )}
        </div>

        <div className="flex border-b border-outline-variant gap-8">
          {['Pending', 'Confirmed', 'Disputed', 'Archived'].map((tab) => {
            const count = notes.filter(n => getFrontendStatus(n) === tab).length;
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
                  <th className="px-4 py-4 w-10 text-center">
                    <button onClick={toggleSelectAll} className="cursor-pointer text-on-surface-variant hover:text-primary">
                      {isAllSelected ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} />}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Note ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Linked Order</th>
                  <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Details</th>
                  <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {currentNotes.map((note) => {
                  const isSelected = selectedIds.includes(note.id);
                  return (
                    <tr 
                      key={note.id}
                      onClick={() => setSelectedNote(note)}
                      className={cn(
                        "hover:bg-surface-container-high/50 transition-colors cursor-pointer group",
                        isSelected && "bg-primary/5"
                      )}
                    >
                      <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button onClick={(e) => toggleSelectNote(note.id, e)} className="cursor-pointer text-on-surface-variant hover:text-primary">
                          {isSelected ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} />}
                        </button>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm font-bold">#DLV-{note.id}</td>
                      <td className="px-6 py-4 font-mono text-sm text-primary font-bold">
                        {note.order ? `#ORD-${note.order}` : (note.supply ? `#SUP-${note.supply}` : '—')}
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant truncate max-w-xs">{note.details}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          note.is_archived ? "bg-gray-200 text-gray-700" :
                          note.status === 'discrepancy' ? "bg-red-100 text-red-800" :
                          note.status === 'confirmed' ? "bg-emerald-100 text-emerald-800" :
                          "bg-amber-100 text-amber-800"
                        )}>
                          {getFrontendStatus(note)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleArchiveNote(note.id, !note.is_archived)}
                            title={note.is_archived ? "Unarchive" : "Archive"}
                            className="p-1.5 text-on-surface-variant hover:text-primary transition-colors cursor-pointer rounded"
                          >
                            <Archive size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            title="Delete"
                            className="p-1.5 text-on-surface-variant hover:text-red-600 transition-colors cursor-pointer rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                          <ChevronRight className="w-4 h-4 text-outline group-hover:text-primary transition-colors ml-1" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
              {selectedNote.status === 'pending' && !selectedNote.is_archived && (
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleUpdateStatus(selectedNote.id, 'confirmed')}
                    className="py-3 bg-primary text-white rounded-lg font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer text-xs"
                  >
                    <Check className="w-4 h-4" /> Confirm Delivery
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus(selectedNote.id, 'discrepancy')}
                    className="py-3 bg-red-600 text-white rounded-lg font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer text-xs"
                  >
                    <AlertTriangle className="w-4 h-4" /> Flag Dispute
                  </button>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => handleArchiveNote(selectedNote.id, !selectedNote.is_archived)}
                  className="py-2.5 bg-white border border-outline-variant text-on-surface rounded-lg font-bold hover:bg-surface-container-high transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
                >
                  <Archive className="w-4 h-4" /> {selectedNote.is_archived ? 'Unarchive' : 'Archive'}
                </button>
                <button 
                  onClick={() => handleDeleteNote(selectedNote.id)}
                  className="py-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
              <button 
                onClick={() => setSelectedNote(null)}
                className="w-full bg-white border border-outline-variant text-on-surface py-2.5 rounded-lg font-bold hover:bg-surface-container-high transition-all cursor-pointer text-xs"
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

            {selectedNote.dispute_reason && (
              <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                <span className="text-[10px] font-bold uppercase text-red-700 tracking-widest block mb-1">Dispute Details</span>
                <p className="text-xs font-semibold text-red-900 leading-relaxed">
                  {selectedNote.dispute_reason}
                </p>
              </div>
            )}

            {selectedNote.signed_by && (
              <div className="bg-surface-container p-4 rounded-xl border border-outline-variant/30 space-y-3">
                <span className="text-[10px] font-bold uppercase text-on-surface-variant tracking-widest block">Recipient Confirmation</span>
                <div className="text-xs font-bold text-on-surface">Signed By: <span className="text-primary font-semibold">{selectedNote.signed_by}</span></div>
                {selectedNote.signature_data && (
                  <div>
                    <span className="text-[10px] text-on-surface-variant block mb-1 font-bold uppercase">Digital Signature</span>
                    <div className="bg-white p-2 border border-outline-variant rounded-lg inline-block shadow-inner">
                      <img src={selectedNote.signature_data} alt="Recipient Signature" className="max-h-24 object-contain" />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/30">
                <span className="text-[10px] font-bold uppercase text-on-surface-variant tracking-widest block mb-1">Created At</span>
                <span className="text-sm font-bold text-primary">{new Date(selectedNote.created_at).toLocaleString()}</span>
              </div>
              <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/30">
                <span className="text-[10px] font-bold uppercase text-on-surface-variant tracking-widest block mb-1">Status</span>
                <span className={cn(
                  "text-xs font-extrabold uppercase",
                  selectedNote.is_archived ? "text-gray-600" :
                  selectedNote.status === 'confirmed' ? "text-green-600" : 
                  (selectedNote.status === 'discrepancy' ? "text-red-600" : "text-amber-600")
                )}>
                  {getFrontendStatus(selectedNote)}
                </span>
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
