"use client";

import React from 'react';
import { CheckCircle2, FileText, X } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
}

export function SuccessModal({
  isOpen,
  onClose,
  title = "Generation Successful!",
  message = "The document has been generated and synced with the ledger.",
  confirmText = "Done",
}: SuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e5e2db] space-y-5 transform transition-all scale-100 text-center font-sans">
        <div className="flex justify-end">
          <button 
            onClick={onClose}
            className="text-[#717971] hover:text-[#1c1c18] transition-colors cursor-pointer p-1 rounded-lg hover:bg-[#f6f3ec]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-700 shadow-inner">
          <FileText size={32} />
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-extrabold text-[#144227] tracking-tight">{title}</h3>
          <p className="text-xs text-[#414942] leading-relaxed">
            {message}
          </p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-[#144227] hover:bg-[#376847] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
