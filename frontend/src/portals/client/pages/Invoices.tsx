"use client";

import React from 'react';
import { ChevronRight, FileText, Clock, AlertCircle, ShoppingCart } from 'lucide-react';

interface InvoicesProps {
  onNavigate: (screen: string) => void;
}

export default function Invoices({ onNavigate }: InvoicesProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 font-sans">
      
      {/* Breadcrumbs */}
      <div className="text-xs text-[#717971] flex items-center gap-1.5">
        <button onClick={() => onNavigate('dashboard')} className="hover:text-[#144227] transition-colors cursor-pointer">Account</button>
        <ChevronRight size={12} />
        <span className="text-[#1c1c18] font-bold">Invoices</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-[#144227] tracking-tight">Billing & Invoices</h1>
        <p className="text-xs text-[#717971] mt-0.5">Order invoices and ledger statement history.</p>
      </div>

      {/* Fallback Notice Card */}
      <div className="bg-white border border-[#e5e2db] rounded-2xl p-12 text-center space-y-4 shadow-sm max-w-xl mx-auto my-8">
        <div className="w-16 h-16 rounded-full bg-[#f6f3ec] text-[#144227] flex items-center justify-center mx-auto border border-[#e5e2db]">
          <Clock className="w-8 h-8 opacity-70" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-[#144227]">Invoice Integration On Hold</h2>
          <p className="text-xs text-[#717971] leading-relaxed max-w-md mx-auto">
            Direct invoice rendering for client orders is temporarily on hold as we prepare integration with our external ledger accounting platform. Order receipts remain available in your Order History.
          </p>
        </div>

        <div className="pt-3 flex items-center justify-center gap-3">
          <button
            onClick={() => onNavigate('dashboard')}
            className="bg-[#144227] text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-[#376847] transition-all cursor-pointer shadow-md"
          >
            Back to Dashboard
          </button>
          <button
            onClick={() => onNavigate('catalog')}
            className="bg-white border border-[#c1c9c0] text-[#414942] px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-[#f6f3ec] transition-colors cursor-pointer"
          >
            Browse Catalog
          </button>
        </div>
      </div>

    </div>
  );
}
