"use client";

import { useState, useRef, useEffect } from 'react';
import { ChevronRight, Calendar, CheckSquare, Square, AlertCircle, Sparkles, Check } from 'lucide-react';

interface DeliveryNoteProps {
  onNavigate: (screen: string) => void;
}

export default function DeliveryNote({ onNavigate }: DeliveryNoteProps) {
  // Checkbox states
  const [checkedItems, setCheckedItems] = useState({
    apples: true,
    kale: true,
    cream: true
  });

  // Quantity inputs
  const [qtyApples, setQtyApples] = useState(25);
  const [qtyKale, setQtyKale] = useState(9); // Mismatch! (Ordered 10)
  const [qtyCream, setQtyCream] = useState(40);

  // Form inputs
  const [receiverName, setReceiverName] = useState('John Doe');
  const [comments, setComments] = useState('');

  // Signature canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  // Success indicator
  const [submitted, setSubmitted] = useState(false);

  // Initialize Canvas events
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set drawing settings
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#144227'; // Dark green ink
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    
    // Scale matching CSS size vs canvas internal sizing
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
    setHasSigned(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => {
      onNavigate('dashboard');
    }, 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Breadcrumbs */}
      <div className="text-xs text-[#717971] flex items-center gap-1.5">
        <button onClick={() => onNavigate('dashboard')} className="hover:text-[#144227] transition-colors cursor-pointer">Deliveries</button>
        <ChevronRight size={12} />
        <span className="text-[#1c1c18] font-bold">Order #HH-82855</span>
      </div>

      {/* Header and Arrived Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#144227] tracking-tight">Delivery Note Confirmation</h1>
          <p className="text-xs text-[#717971] mt-1">Please verify the quantities delivered and sign to confirm receipt.</p>
        </div>

        <div className="bg-[#bceec8]/30 border border-[#bceec8] rounded-xl p-3 flex items-center gap-3 max-w-xs self-start md:self-auto">
          <span className="text-[#144227] p-1.5 bg-white rounded-lg shadow-sm">
            <Calendar size={18} />
          </span>
          <div>
            <p className="text-[8px] font-bold uppercase tracking-wider text-[#717971]">Date Arrived</p>
            <p className="text-xs font-extrabold text-[#1c1c18] mt-0.5">Oct 24, 2023 • 09:42 AM</p>
          </div>
        </div>
      </div>

      {submitted ? (
        <div className="max-w-md mx-auto text-center py-16 space-y-4 bg-white border border-[#e5e2db] rounded-2xl shadow-sm p-8">
          <div className="w-16 h-16 bg-[#bceec8] text-[#00210f] rounded-full flex items-center justify-center mx-auto shadow-md">
            <Sparkles className="w-8 h-8 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-[#144227]">Receipt Confirmed!</h2>
          <p className="text-xs text-[#717971]">
            Thank you! Your delivery verification has been logged and synced. Any discrepancy notes were reported. Returning to Dashboard...
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Items Verification Table */}
          <div className="bg-white border border-[#e5e2db] rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f6f3ec]/60 border-b border-[#e5e2db] text-[9px] uppercase font-extrabold tracking-wider text-[#717971]">
                    <th className="px-6 py-4 w-16 text-center">Verify</th>
                    <th className="px-6 py-4">Product Description</th>
                    <th className="px-6 py-4 w-32">Qty Ordered</th>
                    <th className="px-6 py-4 w-32">Qty Received</th>
                    <th className="px-6 py-4 w-32">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0eee7] text-xs">
                  
                  {/* Row 1: Gala Apples */}
                  <tr>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setCheckedItems({ ...checkedItems, apples: !checkedItems.apples })}
                        className="text-[#144227] hover:scale-105 transition-transform"
                      >
                        {checkedItems.apples ? <CheckSquare size={18} /> : <Square size={18} className="text-[#c1c9c0]" />}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#f6f3ec] rounded-lg overflow-hidden flex-shrink-0">
                          <img src="https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200&q=80" alt="Apples" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-bold text-[#1c1c18]">Gala Apples, Organic</p>
                          <p className="text-[9px] text-[#717971] font-mono mt-0.5">SKU: APP-G-022</p>
                          <button onClick={() => alert("Reported issue for Gala Apples")} className="text-[10px] font-semibold text-[#ba1a1a] hover:underline mt-1 block">
                            Report an issue
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-[#414942]">25 Cases</td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        value={qtyApples}
                        onChange={(e) => setQtyApples(Math.max(0, Number(e.target.value)))}
                        className="w-20 bg-[#f6f3ec]/60 border border-[#c1c9c0] rounded-lg px-2.5 py-1.5 text-center font-bold text-[#1c1c18] focus:outline-none focus:border-[#144227] focus:bg-white"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block bg-[#bceec8] text-[#00210f] text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full uppercase">
                        Pristine
                      </span>
                    </td>
                  </tr>

                  {/* Row 2: Curly Kale (Shortage mismatch!) */}
                  <tr className="bg-[#ffdad6]/10">
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setCheckedItems({ ...checkedItems, kale: !checkedItems.kale })}
                        className="text-[#144227] hover:scale-105 transition-transform"
                      >
                        {checkedItems.kale ? <CheckSquare size={18} /> : <Square size={18} className="text-[#c1c9c0]" />}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#f6f3ec] rounded-lg overflow-hidden flex-shrink-0">
                          <img src="https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=200&q=80" alt="Kale" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-bold text-[#1c1c18]">Curly Kale, Bulk</p>
                          <p className="text-[9px] text-[#717971] font-mono mt-0.5">SKU: KALE-C-005</p>
                          <button onClick={() => alert("Reported issue for Curly Kale")} className="text-[10px] font-semibold text-[#ba1a1a] hover:underline mt-1 block">
                            Report an issue
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-[#414942]">10 Bunches</td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        value={qtyKale}
                        onChange={(e) => setQtyKale(Math.max(0, Number(e.target.value)))}
                        className="w-20 bg-white border-2 border-[#ba1a1a] rounded-lg px-2.5 py-1.5 text-center font-bold text-[#ba1a1a] focus:outline-none focus:ring-1 focus:ring-[#ba1a1a]"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block bg-[#ffdad6] text-[#93000a] text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full uppercase flex items-center gap-1 w-fit">
                        <AlertCircle size={10} /> Shortage
                      </span>
                    </td>
                  </tr>

                  {/* Row 3: Heavy Cream */}
                  <tr>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setCheckedItems({ ...checkedItems, cream: !checkedItems.cream })}
                        className="text-[#144227] hover:scale-105 transition-transform"
                      >
                        {checkedItems.cream ? <CheckSquare size={18} /> : <Square size={18} className="text-[#c1c9c0]" />}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#f6f3ec] rounded-lg overflow-hidden flex-shrink-0">
                          <img src="https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&q=80" alt="Cream" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-bold text-[#1c1c18]">Heavy Cream, 1L</p>
                          <p className="text-[9px] text-[#717971] font-mono mt-0.5">SKU: DAIRY-HC-99</p>
                          <button onClick={() => alert("Reported issue for Heavy Cream")} className="text-[10px] font-semibold text-[#ba1a1a] hover:underline mt-1 block">
                            Report an issue
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-[#414942]">40 Units</td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        value={qtyCream}
                        onChange={(e) => setQtyCream(Math.max(0, Number(e.target.value)))}
                        className="w-20 bg-[#f6f3ec]/60 border border-[#c1c9c0] rounded-lg px-2.5 py-1.5 text-center font-bold text-[#1c1c18] focus:outline-none focus:border-[#144227] focus:bg-white"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block bg-[#bceec8] text-[#00210f] text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full uppercase">
                        Pristine
                      </span>
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>
            
            {/* Table Footer actions */}
            <div className="bg-[#f6f3ec]/30 border-t border-[#e5e2db] px-6 py-4 flex items-center justify-between text-xs text-[#717971]">
              <span>Showing 3 of 3 items in delivery</span>
              <button
                onClick={() => alert("Discrepancy note logged.")}
                className="bg-white border border-[#c1c9c0] text-[#414942] hover:bg-[#fcf9f2] font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                Bulk Discrepancy Note
              </button>
            </div>
          </div>

          {/* Details & Signature Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Confirmation details form */}
            <div className="bg-white border border-[#e5e2db] rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-[#1c1c18] pb-3 border-b border-[#f0eee7]">Confirmation Detail</h2>
              
              <div>
                <label className="block text-[9px] uppercase font-bold tracking-wider text-[#717971] mb-1">Receiver's Name</label>
                <input
                  type="text"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  className="w-full bg-[#f6f3ec]/60 border border-[#c1c9c0] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#144227] focus:bg-white text-[#1c1c18]"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase font-bold tracking-wider text-[#717971] mb-1">Comments / Notes</label>
                <textarea
                  rows={4}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Add any general delivery comments here..."
                  className="w-full bg-[#f6f3ec]/60 border border-[#c1c9c0] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#144227] focus:bg-white text-[#1c1c18]"
                />
              </div>
            </div>

            {/* Canvas signature box */}
            <div className="bg-white border border-[#e5e2db] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-[#f0eee7]">
                <h2 className="text-sm font-bold text-[#1c1c18]">Digital Signature</h2>
                <button
                  onClick={clearSignature}
                  className="text-xs font-bold text-[#ba1a1a] hover:underline cursor-pointer"
                >
                  Clear
                </button>
              </div>

              {/* Pad Frame */}
              <div className="relative border-2 border-dashed border-[#c1c9c0] hover:border-[#144227] rounded-xl overflow-hidden bg-[#fcf9f2] h-40 flex items-center justify-center mt-4">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={200}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-full absolute inset-0 cursor-crosshair touch-none"
                />
                
                {!hasSigned && (
                  <p className="text-xs text-[#717971] font-medium pointer-events-none select-none">
                    Sign inside the box
                  </p>
                )}
              </div>

              <div className="text-[10px] text-[#717971] text-right mt-3">
                * Draws directly on the canvas using mouse or touch.
              </div>
            </div>

          </div>

          {/* Action buttons at bottom */}
          <div className="flex items-center justify-between pt-4 border-t border-[#e5e2db]">
            <button
              onClick={() => onNavigate('dashboard')}
              className="text-xs font-bold text-[#414942] hover:text-[#144227] hover:underline cursor-pointer"
            >
              Cancel & Re-Schedule
            </button>

            <button
              onClick={handleSubmit}
              className="bg-[#144227] text-white px-6 py-3 rounded-lg text-xs font-bold hover:bg-[#376847] shadow-sm hover:shadow flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              Submit Confirmation
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
