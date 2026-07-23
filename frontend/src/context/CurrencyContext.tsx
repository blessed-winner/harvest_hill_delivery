"use client";

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type CurrencyCode = 'USD' | 'RWF' | 'EUR' | 'GBP';

interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  rate: number; // from USD
  locale: string;
  decimals: number;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  USD: { code: 'USD', symbol: '$', rate: 1, locale: 'en-US', decimals: 2 },
  RWF: { code: 'RWF', symbol: 'RWF', rate: 1300, locale: 'rw-RW', decimals: 0 },
  EUR: { code: 'EUR', symbol: '€', rate: 0.92, locale: 'fr-FR', decimals: 2 },
  GBP: { code: 'GBP', symbol: '£', rate: 0.79, locale: 'en-GB', decimals: 2 },
};

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  convert: (amountUSD: number) => number;
  formatPrice: (amountUSD: number | string | null | undefined, fallback?: string) => string;
  currencyInfo: CurrencyInfo;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('preferred_currency') as CurrencyCode) || 'RWF';
    }
    return 'RWF';
  });

  const setCurrency = useCallback((code: CurrencyCode) => {
    setCurrencyState(code);
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred_currency', code);
    }
  }, []);

  const info = CURRENCIES[currency];

  const convert = useCallback((amountUSD: number): number => {
    return amountUSD * info.rate;
  }, [info.rate]);

  const formatPrice = useCallback((amountUSD: number | string | null | undefined, fallback = '$0.00'): string => {
    if (amountUSD === null || amountUSD === undefined || amountUSD === '') return fallback;
    const num = typeof amountUSD === 'string' ? parseFloat(amountUSD) : amountUSD;
    if (!Number.isFinite(num)) return fallback;

    const converted = num * info.rate;
    const formatted = converted.toLocaleString('en-US', {
      minimumFractionDigits: info.decimals,
      maximumFractionDigits: info.decimals,
    });

    if (info.code === 'RWF') return `RWF ${formatted}`;
    return `${info.symbol}${formatted}`;
  }, [info]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convert, formatPrice, currencyInfo: info }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return ctx;
}
