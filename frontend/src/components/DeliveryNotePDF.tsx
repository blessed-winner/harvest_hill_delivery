"use client";

import React, { useRef, useState } from 'react';
import { X, Download, Loader2 } from 'lucide-react';

interface DeliveryNotePDFProps {
  isOpen: boolean;
  onClose: () => void;
  note: any;
  order: any;
}

export function DeliveryNotePDF({ isOpen, onClose, note, order }: DeliveryNotePDFProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const orderItems = order?.items || note?.order_detail?.items || [];
  const clientInfo = order?.client_detail || note?.order_detail?.client_detail || {};

  const recipientName = note?.signed_by || 
    [clientInfo?.first_name, clientInfo?.last_name].filter(Boolean).join(' ') || 
    clientInfo?.business_name || 
    'Valued Client';

  const recipientAddress = order?.delivery_address || 
    clientInfo?.delivery_address || 
    'Ellington, United Kingdom';

  const noteId = note?.display_id || note?.displayId || (note?.id ? (String(note.id).startsWith('DLV-') ? note.id : `DLV-${note.id}`) : (order?.id ? `DLV-${order.id}` : 'DLV-000001'));
  const issueDate = note?.created_at ? new Date(note.created_at).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');

  const handleDownloadPDF = async () => {
    const element = printRef.current;
    if (!element || downloading) return;

    try {
      setDownloading(true);

      let html2pdf = (window as any).html2pdf;
      if (!html2pdf) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load PDF generator library'));
          document.head.appendChild(script);
        });
        html2pdf = (window as any).html2pdf;
      }

      const filename = `Delivery_Note_${noteId}.pdf`;
      const opt = {
        margin: [10, 10, 10, 10],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          onclone: (clonedDoc: Document) => {
            // Remove style/link tags with modern lab()/oklch() definitions that crash html2canvas
            const styles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
            styles.forEach(s => {
              if (s.textContent?.includes('lab(') || s.textContent?.includes('oklch(')) {
                s.remove();
              }
            });
          }
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl border border-gray-200 relative my-8">
        
        {/* Top Control Bar */}
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4 no-print">
          <div className="flex items-center gap-2 text-emerald-900 font-bold">
            <span>Delivery Note Preview</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2 bg-[#144227] hover:bg-[#376847] text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-60"
            >
              {downloading ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Downloading PDF...
                </>
              ) : (
                <>
                  <Download size={15} /> Export PDF
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Delivery Note Area */}
        <div 
          ref={printRef} 
          className="bg-white p-6 sm:p-10 font-sans text-gray-900 leading-relaxed border border-gray-100 shadow-sm rounded-xl"
          style={{ backgroundColor: '#ffffff', color: '#111827', padding: '32px', fontFamily: 'sans-serif' }}
        >
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '0.05em', color: '#111827', margin: 0, textTransform: 'uppercase' }}>
              DELIVERY NOTE
            </h1>
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', color: '#111827', fontWeight: '800', fontSize: '18px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 3L2 12h3v8h14v-8h3L12 3z" />
                </svg>
                HARVEST HILL
              </div>
              <p style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#6b7280', fontWeight: '600', margin: '2px 0 0 0' }}>FRESH LOGISTICS</p>
            </div>
          </div>

          <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '24px' }}>
            Harvest Hill Logistics Ltd, KG 7 Ave, Kigali, Rwanda
          </p>

          {/* FOR & Note Info Grid */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '12px', marginBottom: '24px' }}>
            <div>
              <p style={{ fontWeight: '800', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#111827', marginBottom: '4px' }}>FOR</p>
              <p style={{ fontWeight: '600', color: '#1f2937', margin: 0 }}>{recipientName}</p>
              <p style={{ color: '#4b5563', maxWidth: '280px', margin: '2px 0 0 0', whiteSpace: 'pre-line' }}>{recipientAddress}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: '#6b7280' }}>Delivery note No:</span>
                <span style={{ fontWeight: '700', color: '#111827' }}>{noteId}</span>
              </div>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', fontSize: '12px' }}>
                <span style={{ color: '#6b7280' }}>Issue date:</span>
                <span style={{ fontWeight: '700', color: '#111827' }}>{issueDate}</span>
              </div>
            </div>
          </div>

          {/* Goods Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#374151' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left' }}>PRODUCT NAME</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>QUANTITY</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>UNIT PRICE</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>TOTAL PRICE</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: '11px' }}>
              {orderItems.length > 0 ? (
                orderItems.map((item: any, idx: number) => {
                  const prodName = item.product_detail?.name || item.product_name || item.name || `Item #${idx + 1}`;
                  const unit = item.product_detail?.unit || item.unit || 'pcs';
                  const qty = Number(item.quantity || 1);
                  const price = Number(item.price || item.unit_price || 0);
                  const itemTotal = qty * price;
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px', fontWeight: '500', color: '#1f2937' }}>{prodName}</td>
                      <td style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#111827' }}>{qty} {unit}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#374151' }}>RWF {price.toLocaleString()}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: '#111827' }}>RWF {itemTotal.toLocaleString()}</td>
                    </tr>
                  );
                })
              ) : (
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px', fontWeight: '500', color: '#1f2937' }}>
                    {note?.details || order?.delivery_address || 'Fresh Harvest Produce Dispatch'}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#111827' }}>1 pkg</td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#374151' }}>RWF 0</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: '#111827' }}>RWF 0</td>
                </tr>
              )}
            </tbody>
            {orderItems.length > 0 && (
              <tfoot>
                <tr style={{ borderTop: '2px solid #d1d5db', fontWeight: '700', fontSize: '11px', backgroundColor: '#f9fafb' }}>
                  <td colSpan={3} style={{ padding: '10px 12px', textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#111827' }}>Total Cost:</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '800', color: '#064e3b', fontSize: '13px' }}>
                    RWF {orderItems.reduce((sum: number, item: any) => sum + (Number(item.quantity || 1) * Number(item.price || item.unit_price || 0)), 0).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>

          {/* Signature Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '10px', fontWeight: '800', color: '#111827', textTransform: 'uppercase', margin: 0 }}>Issued by, signature:</p>
              {note?.signature_data ? (
                <img src={note.signature_data} alt="Signature" style={{ maxHeight: '48px', objectFit: 'contain', marginLeft: 'auto', marginTop: '8px' }} />
              ) : (
                <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '20px', color: '#1f2937', margin: '8px 0 0 0' }}>
                  {recipientName}
                </p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
