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

      let html2pdf: any = (window as any).html2pdf;
      if (!html2pdf) {
        try {
          // @ts-ignore
          const mod = await import('html2pdf.js');
          html2pdf = mod.default || mod;
        } catch {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load PDF generator library'));
            document.head.appendChild(script);
          });
          html2pdf = (window as any).html2pdf;
        }
      }

      const filename = `Delivery_Note_${noteId}.pdf`;
      const opt = {
        margin: [10, 10, 10, 10],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
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
        <div ref={printRef} className="bg-white p-6 sm:p-10 font-sans text-gray-900 leading-relaxed border border-gray-100 shadow-sm rounded-xl">
          
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <h1 className="text-2xl font-extrabold tracking-wider text-gray-900 uppercase">DELIVERY NOTE</h1>
            <div className="text-right">
              <div className="flex items-center justify-end gap-1 text-gray-900 font-extrabold text-lg tracking-wider">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 3L2 12h3v8h14v-8h3L12 3z" />
                </svg>
                HARVEST HILL
              </div>
              <p className="text-[9px] uppercase tracking-widest text-gray-500 font-semibold">FRESH LOGISTICS</p>
            </div>
          </div>

          <p className="text-[11px] text-gray-500 mb-8">
            Harvest Hill Logistics Ltd, KG 7 Ave, Kigali, Rwanda
          </p>

          {/* FOR & Note Info Grid */}
          <div className="flex justify-between items-start text-xs mb-8">
            <div>
              <p className="font-extrabold text-[10px] uppercase tracking-wider text-gray-900 mb-1">FOR</p>
              <p className="font-semibold text-gray-800">{recipientName}</p>
              <p className="text-gray-600 max-w-xs whitespace-pre-line">{recipientAddress}</p>
            </div>
            <div className="text-right space-y-1">
              <div className="flex gap-4 justify-end text-xs">
                <span className="text-gray-500">Delivery note No:</span>
                <span className="font-bold text-gray-900">{noteId}</span>
              </div>
              <div className="flex gap-4 justify-end text-xs">
                <span className="text-gray-500">Issue date:</span>
                <span className="font-bold text-gray-900">{issueDate}</span>
              </div>
            </div>
          </div>

          {/* Goods Table */}
          <table className="w-full text-left border-collapse mb-8">
            <thead>
              <tr className="bg-gray-100 text-[10px] font-extrabold uppercase tracking-wider text-gray-700">
                <th className="py-3 px-4">PRODUCT NAME</th>
                <th className="py-3 px-4 text-center">QUANTITY</th>
                <th className="py-3 px-4 text-right">UNIT PRICE</th>
                <th className="py-3 px-4 text-right">TOTAL PRICE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-xs">
              {orderItems.length > 0 ? (
                orderItems.map((item: any, idx: number) => {
                  const prodName = item.product_detail?.name || item.product_name || item.name || `Item #${idx + 1}`;
                  const unit = item.product_detail?.unit || item.unit || 'pcs';
                  const qty = Number(item.quantity || 1);
                  const price = Number(item.price || item.unit_price || 0);
                  const itemTotal = qty * price;
                  return (
                    <tr key={idx}>
                      <td className="py-3.5 px-4 font-medium text-gray-800">{prodName}</td>
                      <td className="py-3.5 px-4 text-center font-semibold text-gray-900">{qty} {unit}</td>
                      <td className="py-3.5 px-4 text-right text-gray-700">RWF {price.toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-gray-900">RWF {itemTotal.toLocaleString()}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="py-3.5 px-4 font-medium text-gray-800">
                    {note?.details || order?.delivery_address || 'Fresh Harvest Produce Dispatch'}
                  </td>
                  <td className="py-3.5 px-4 text-center font-semibold text-gray-900">1 pkg</td>
                  <td className="py-3.5 px-4 text-right text-gray-700">RWF 0</td>
                  <td className="py-3.5 px-4 text-right font-bold text-gray-900">RWF 0</td>
                </tr>
              )}
            </tbody>
            {orderItems.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-gray-300 font-bold text-xs bg-gray-50">
                  <td colSpan={3} className="py-3 px-4 text-right uppercase tracking-wider text-gray-900">Total Cost:</td>
                  <td className="py-3 px-4 text-right font-extrabold text-emerald-900 text-sm">
                    RWF {orderItems.reduce((sum: number, item: any) => sum + (Number(item.quantity || 1) * Number(item.price || item.unit_price || 0)), 0).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>

          {/* Signature Footer */}
          <div className="flex justify-end pt-4">
            <div className="text-right">
              <p className="text-[10px] font-extrabold text-gray-900 uppercase">Issued by, signature:</p>
              {note?.signature_data ? (
                <img src={note.signature_data} alt="Signature" className="max-h-12 object-contain ml-auto mt-2" />
              ) : (
                <p className="font-serif italic text-xl text-gray-800 mt-2">
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
