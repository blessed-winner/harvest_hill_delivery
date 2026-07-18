"use client";

import { useState, useRef, useEffect } from 'react';
import { ChevronRight, Calendar, CheckSquare, Square, AlertCircle, Sparkles, Loader2, Package } from 'lucide-react';
import { clientApi } from '../lib/api';

interface DeliveryNoteProps {
  onNavigate: (screen: string) => void;
}

export default function DeliveryNote({ onNavigate }: DeliveryNoteProps) {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Signature canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  // Form inputs
  const [receiverName, setReceiverName] = useState('');
  const [comments, setComments] = useState('');

  // Success indicator
  const [submitted, setSubmitted] = useState(false);

  // Load delivered orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await clientApi.orders.list('delivered');
        setOrders(data || []);
      } catch (err: any) {
        console.error('Failed to fetch delivery notes:', err);
        setError(err.message || 'Failed to load delivery notes');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

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
      onNavigate('order-history');
    }, 2500);
  };

  // Pagination
  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const paginatedOrders = orders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#144227] animate-spin mx-auto mb-4" />
          <p className="text-sm text-[#717971]">Loading delivery notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Breadcrumbs */}
      <div className="text-xs text-[#717971] flex items-center gap-1.5">
        <button onClick={() => onNavigate('dashboard')} className="hover:text-[#144227] transition-colors cursor-pointer">Orders</button>
        <ChevronRight size={12} />
        <span className="text-[#1c1c18] font-bold">Delivery Notes</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-[#144227] tracking-tight">Delivery Notes</h1>
        <p className="text-xs text-[#717971] mt-1">Review your delivered orders and their details.</p>
      </div>

      {error && (
        <div className="bg-white border border-[#e5e2db] rounded-2xl p-12 text-center">
          <AlertCircle className="w-16 h-16 text-[#c1c9c0] mx-auto mb-4" />
          <h2 className="text-lg font-bold text-[#1c1c18] mb-2">Unable to Load Delivery Notes</h2>
          <p className="text-sm text-[#717971] mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#144227] text-white text-sm font-bold px-6 py-2 rounded-lg hover:bg-[#376847] transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {!error && orders.length === 0 && (
        <div className="bg-white border border-[#e5e2db] rounded-2xl p-12 text-center">
          <Package className="w-16 h-16 text-[#c1c9c0] mx-auto mb-4" />
          <h2 className="text-lg font-bold text-[#1c1c18] mb-2">No Delivered Orders</h2>
          <p className="text-sm text-[#717971] mb-4">
            You don't have any delivered orders yet. Delivery notes will appear here once orders are delivered.
          </p>
          <button
            onClick={() => onNavigate('catalog')}
            className="bg-[#144227] text-white text-sm font-bold px-6 py-2 rounded-lg hover:bg-[#376847] transition-colors"
          >
            Browse Products
          </button>
        </div>
      )}

      {!error && orders.length > 0 && (
        <div className="bg-white border border-[#e5e2db] rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f6f3ec]/60 border-b border-[#e5e2db] text-[9px] uppercase font-extrabold tracking-wider text-[#717971]">
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Delivery Date</th>
                  <th className="px-6 py-4">Items</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0eee7] text-xs">
                {paginatedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#f2efe7]/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-[#1c1c18]">#{order.id}</td>
                    <td className="px-6 py-4 text-[#414942]">
                      {order.updated_at ? new Date(order.updated_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      }) : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-[#1c1c18]">{order.items?.length || 0} items</span>
                    </td>
                    <td className="px-6 py-4 font-extrabold text-[#1c1c18]">
                      ${typeof order.total_price === 'number' ? order.total_price.toFixed(2) : '0.00'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block bg-[#bceec8] text-[#00210f] text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full uppercase">
                        Delivered
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => onNavigate('order-history')}
                        className="text-xs font-bold text-[#144227] hover:underline"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="bg-[#f6f3ec]/30 border-t border-[#e5e2db] px-6 py-4 flex items-center justify-between text-xs text-[#717971]">
            <span>
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, orders.length)} of {orders.length} delivery notes
            </span>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-[#c1c9c0] rounded hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="font-bold text-[#1c1c18] px-2">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-[#c1c9c0] rounded hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
