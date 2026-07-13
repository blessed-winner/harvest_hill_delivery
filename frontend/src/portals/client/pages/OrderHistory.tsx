"use client";

import { useState } from 'react';
import { Search, ChevronDown, ChevronUp, Clock, CheckCircle2, Truck, FileText } from 'lucide-react';

interface OrderHistoryProps {
  onNavigate: (screen: string) => void;
}

export default function OrderHistory({ onNavigate }: OrderHistoryProps) {
  const [activeFilter, setActiveFilter] = useState('All Orders');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const filters = ['All Orders', 'Submitted', 'Approved', 'In Delivery', 'Completed'];

  const orders = [
    {
      id: '#HH-98234',
      name: 'Premium Orchard Harvest',
      date: 'May 12, 2024',
      itemsCount: 12,
      price: '$1,240.00',
      status: 'IN DELIVERY',
      statusColor: 'bg-[#bceec8] text-[#00210f]',
      img: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200&q=80',
      steps: [
        { label: 'Submitted', active: true },
        { label: 'Approved', active: true },
        { label: 'Shipping', active: true },
        { label: 'Invoiced', active: false }
      ],
      details: [
        { name: 'Organic Honeycrisp Apples', qty: '4 cases', price: '$380.00' },
        { desc: 'Sweet Bing Cherries', qty: '6 baskets', price: '$600.00' },
        { desc: 'Sun-Ripened Apricots', qty: '2 cases', price: '$260.00' }
      ]
    },
    {
      id: '#HH-97102',
      name: 'Highland Dairy Selection',
      date: 'April 28, 2024',
      itemsCount: 5,
      price: '$890.50',
      status: 'COMPLETED',
      statusColor: 'bg-[#f0eee7] text-[#414942]',
      img: 'https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=200&q=80',
      steps: [
        { label: 'Submitted', active: true },
        { label: 'Approved', active: true },
        { label: 'Shipping', active: true },
        { label: 'Invoiced', active: true }
      ],
      details: [
        { name: 'Aged Sharp Cheddar Block', qty: '10 blocks', price: '$220.00' },
        { desc: 'Grass-fed Salted Butter', qty: '40 lbs', price: '$480.00' },
        { desc: 'Fresh Heavy Cream 1L', qty: '15 units', price: '$190.50' }
      ]
    },
    {
      id: '#HH-96041',
      name: 'Grains & Pantry Restock',
      date: 'May 15, 2024',
      itemsCount: 24,
      price: '$3,450.00',
      status: 'SUBMITTED',
      statusColor: 'bg-[#ffdcc5] text-[#301400]',
      img: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&q=80',
      steps: [
        { label: 'Submitted', active: true },
        { label: 'Approved', active: false },
        { label: 'Shipping', active: false },
        { label: 'Invoiced', active: false }
      ],
      details: [
        { name: 'Red Winter Wheat Bulk', qty: '1000 lbs', price: '$2,500.00' },
        { desc: 'Organic Rolled Oats', qty: '400 lbs', price: '$950.00' }
      ]
    }
  ];

  const handleToggleExpand = (id: string) => {
    setExpandedOrder(expandedOrder === id ? null : id);
  };

  const filteredOrders = orders.filter(order => {
    if (activeFilter === 'All Orders') return true;
    return order.status.toLowerCase() === activeFilter.toLowerCase();
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-[#144227] tracking-tight font-sans">Order History</h1>
        <p className="text-xs text-[#717971] mt-0.5">Manage your recent farm-to-table procurement and track shipments.</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#e5e2db] pb-4">
        {filters.map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#144227] text-white shadow-sm'
                  : 'bg-[#f0eee7]/60 text-[#414942] hover:bg-[#f0eee7] hover:text-[#144227]'
              }`}
            >
              {filter}
            </button>
          );
        })}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => {
          const isExpanded = expandedOrder === order.id;
          
          return (
            <div
              key={order.id}
              className="bg-white border border-[#e5e2db] rounded-2xl shadow-sm overflow-hidden transition-all duration-200"
            >
              
              {/* Order Row Header */}
              <div
                onClick={() => handleToggleExpand(order.id)}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer hover:bg-[#fcf9f2]/40"
              >
                
                {/* Left side: Image & Order metadata */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-[#f6f3ec] rounded-xl overflow-hidden flex-shrink-0 border border-[#e5e2db]">
                    <img src={order.img} alt={order.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-[10px] font-bold text-[#717971] font-mono">{order.id}</span>
                      <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${order.statusColor}`}>
                        {order.status}
                      </span>
                    </div>
                    <h3 className="text-sm font-extrabold text-[#1c1c18] mt-1">{order.name}</h3>
                    <p className="text-[10px] text-[#717971] font-medium mt-0.5">{order.date} • {order.itemsCount} Items • <span className="font-bold text-[#1c1c18]">{order.price}</span></p>
                  </div>
                </div>

                {/* Center: Steps Timeline */}
                <div className="flex-grow max-w-md px-4 py-2">
                  <div className="relative flex items-center justify-between">
                    
                    {/* Background Progress connector Line */}
                    <div className="absolute left-1 right-1 top-2.5 h-[3px] bg-[#f0eee7] -z-10 rounded-full" />
                    
                    {/* Foreground Active Line */}
                    <div
                      className="absolute left-1 top-2.5 h-[3px] bg-[#376847] -z-10 rounded-full transition-all duration-300"
                      style={{
                        width: order.status === 'SUBMITTED' ? '0%' :
                               order.status === 'IN DELIVERY' ? '66%' : '100%'
                      }}
                    />

                    {order.steps.map((step, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-1.5 flex-1 relative">
                        <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center border-2 transition-colors ${
                          step.active
                            ? 'bg-[#144227] border-[#144227] text-white shadow-sm'
                            : 'bg-white border-[#c1c9c0] text-[#717971]'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${step.active ? 'bg-white' : 'bg-[#c1c9c0]'}`} />
                        </div>
                        <span className={`text-[8px] font-extrabold tracking-wide uppercase ${
                          step.active ? 'text-[#144227] font-black' : 'text-[#717971]'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                    ))}

                  </div>
                </div>

                {/* Right side: Caret */}
                <div className="self-end md:self-auto text-right text-[#717971]">
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>

              </div>

              {/* Expandable Order Details Drawer */}
              {isExpanded && (
                <div className="bg-[#fcf9f2]/30 border-t border-[#f0eee7] px-5 py-4 space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-[#f0eee7] pb-2">
                    <span className="text-[10px] font-bold text-[#717971] uppercase tracking-wider">Item Breakdown</span>
                    <button
                      onClick={() => onNavigate('invoices')}
                      className="text-[10px] font-bold text-[#144227] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      View Invoice Details →
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {order.details.map((det, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs text-[#414942]">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-[#376847] rounded-full" />
                          <span className="font-bold text-[#1c1c18]">{det.name || det.desc}</span>
                        </div>
                        <div className="flex gap-10">
                          <span className="text-[#717971] font-semibold">{det.qty}</span>
                          <span className="font-bold text-[#1c1c18]">{det.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="text-center py-10 bg-white border border-[#e5e2db] rounded-2xl text-xs text-[#717971] italic shadow-sm">
            No orders found for category "{activeFilter}".
          </div>
        )}
      </div>

    </div>
  );
}
