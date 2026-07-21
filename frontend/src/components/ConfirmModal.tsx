"use client";

import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  isDanger = true,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e5e2db] space-y-5 transform transition-all scale-100">
        <div className="flex items-center justify-between border-b border-[#e5e2db] pb-3">
          <div className="flex items-center gap-2 text-[#ba1a1a]">
            {isDanger ? <Trash2 size={20} /> : <AlertTriangle size={20} />}
            <h3 className="text-base font-extrabold text-[#1c1c18] font-sans">{title}</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-[#717971] hover:text-[#1c1c18] transition-colors cursor-pointer p-1 rounded-lg hover:bg-[#f6f3ec]"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-[#414942] font-medium leading-relaxed font-sans">
          {message}
        </p>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-1/2 py-2.5 border border-[#c1c9c0] rounded-xl text-xs font-bold text-[#414942] hover:bg-[#f6f3ec] transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`w-1/2 py-2.5 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
              isDanger ? 'bg-[#ba1a1a] hover:bg-[#93000a]' : 'bg-[#144227] hover:bg-[#376847]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
