"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useCurrency, CURRENCIES, type CurrencyCode } from '../context/CurrencyContext';
import { ChevronDown } from 'lucide-react';

export function CurrencyToggle() {
  const { currency, setCurrency, currencyInfo } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const codes: CurrencyCode[] = ['USD', 'RWF'];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 backdrop-blur border border-[#c1c9c0] rounded-lg text-xs font-bold text-[#1c1c18] hover:bg-white hover:shadow-sm transition-all cursor-pointer"
      >
        <span className="text-[#144227] font-extrabold">{currencyInfo.symbol === 'RWF' ? 'RWF' : currencyInfo.symbol}</span>
        <span className="text-[#414942]">{currency}</span>
        <ChevronDown className={`w-3 h-3 text-[#717971] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-[#c1c9c0] rounded-xl shadow-lg z-50 overflow-hidden min-w-[140px] animate-in fade-in slide-in-from-top-1 duration-150">
          {codes.map((code) => {
            const info = CURRENCIES[code];
            const isActive = currency === code;
            return (
              <button
                key={code}
                onClick={() => { setCurrency(code); setIsOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-[#144227]/5 text-[#144227]' 
                    : 'text-[#414942] hover:bg-[#f6f3ec]'
                }`}
              >
                <span className="w-6 text-center font-extrabold">{info.symbol === 'RWF' ? 'Fr' : info.symbol}</span>
                <span>{code}</span>
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#144227]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
