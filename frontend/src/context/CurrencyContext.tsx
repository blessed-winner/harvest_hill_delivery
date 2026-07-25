"use client";

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type CurrencyCode = 'RWF';

interface CurrencyInfo {
  code: 'RWF';
  symbol: 'RWF';
  rate: 1;
  locale: string;
  decimals: number;
}

export const CURRENCIES: Record<'RWF', CurrencyInfo> = {
  RWF: { code: 'RWF', symbol: 'RWF', rate: 1, locale: 'rw-RW', decimals: 0 },
};

interface CurrencyContextType {
  currency: 'RWF';
  setCurrency: (code: 'RWF') => void;
  convert: (amount: number) => number;
  formatPrice: (amount: number | string | null | undefined, fallback?: string) => string;
  currencyInfo: CurrencyInfo;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const currency: 'RWF' = 'RWF';
  const info: CurrencyInfo = CURRENCIES.RWF;

  const setCurrency = useCallback(() => {}, []);

  const convert = useCallback((amount: number): number => {
    if (amount > 0 && amount < 100) return Math.round(amount * 1473.97);
    return amount;
  }, []);

  const formatPrice = useCallback((amount: number | string | null | undefined, fallback = 'RWF 0'): string => {
    if (amount === null || amount === undefined || amount === '') return fallback;
    let num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (!Number.isFinite(num)) return fallback;
    if (num > 0 && num < 100) {
      num = Math.round(num * 1473.97);
    }
    return `RWF ${num.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  }, []);

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
