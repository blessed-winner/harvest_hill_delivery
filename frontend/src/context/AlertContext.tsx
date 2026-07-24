"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

export interface AlertModalOptions {
  title: string;
  message: string;
  type?: ToastType;
  confirmText?: string;
  resolve?: () => void;
}

export interface ConfirmModalOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  resolve?: (value: boolean) => void;
}

interface AlertContextType {
  toast: (message: string, type?: ToastType) => void;
  showAlert: (title: string, message: string, type?: ToastType, confirmText?: string) => Promise<void>;
  showConfirm: (title: string, message: string, options?: { confirmText?: string; cancelText?: string; isDanger?: boolean }) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [alertConfig, setAlertConfig] = useState<AlertModalOptions | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<ConfirmModalOptions | null>(null);

  // Session Keeper Logic
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    const performTokenRefresh = async () => {
      const refreshToken = window.localStorage.getItem('refresh_token');
      if (!refreshToken) return;

      try {
        const response = await fetch(`${API_BASE}/api/accounts/token/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refreshToken }),
        });

        if (response.ok) {
          const data = await response.json();
          window.localStorage.setItem('access_token', data.access);
          if (data.refresh) {
            window.localStorage.setItem('refresh_token', data.refresh);
          }
          console.log("[SessionKeeper] Token refreshed successfully.");
        } else {
          // Token is invalid/expired
          console.warn("[SessionKeeper] Refresh token invalid or expired.");
          window.localStorage.removeItem('access_token');
          window.localStorage.removeItem('refresh_token');
          window.localStorage.removeItem('user_role');
          if (window.location.pathname !== '/') {
            window.location.href = '/';
          }
        }
      } catch (err) {
        console.error("[SessionKeeper] Background token refresh failed:", err);
      }
    };

    // 1. Proactive refresh on app mount if logged in
    const accessToken = window.localStorage.getItem('access_token');
    const refreshToken = window.localStorage.getItem('refresh_token');
    if (accessToken && refreshToken) {
      performTokenRefresh();
    }

    // 2. Set up interval to refresh token every 10 minutes (600000ms)
    const intervalId = setInterval(() => {
      const token = window.localStorage.getItem('access_token');
      const refresh = window.localStorage.getItem('refresh_token');
      if (token && refresh) {
        performTokenRefresh();
      }
    }, 600000);

    return () => clearInterval(intervalId);
  }, []);

  // Trigger a Toast
  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove toast after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Trigger custom Alert Modal
  const showAlert = useCallback((title: string, message: string, type: ToastType = 'info', confirmText = 'OK'): Promise<void> => {
    return new Promise<void>((resolve) => {
      setAlertConfig({
        title,
        message,
        type,
        confirmText,
        resolve: () => {
          setAlertConfig(null);
          resolve();
        }
      });
    });
  }, []);

  // Trigger custom Confirm Modal
  const showConfirm = useCallback((
    title: string,
    message: string,
    options?: { confirmText?: string; cancelText?: string; isDanger?: boolean }
  ): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setConfirmConfig({
        title,
        message,
        confirmText: options?.confirmText || 'Confirm',
        cancelText: options?.cancelText || 'Cancel',
        isDanger: options?.isDanger ?? true,
        resolve: (val: boolean) => {
          setConfirmConfig(null);
          resolve(val);
        }
      });
    });
  }, []);

  return (
    <AlertContext.Provider value={{ toast, showAlert, showConfirm }}>
      {children}

      {/* Toast notifications container */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-md w-full pointer-events-none">
        {toasts.map((t) => {
          let Icon = Info;
          let bgColor = 'bg-white/95';
          let textColor = 'text-[#1c1c18]';
          let iconColor = 'text-[#144227]';
          let borderColor = 'border-[#e5e2db]';

          if (t.type === 'success') {
            Icon = CheckCircle2;
            bgColor = 'bg-emerald-50/95';
            iconColor = 'text-emerald-600';
            borderColor = 'border-emerald-200';
          } else if (t.type === 'error') {
            Icon = XCircle;
            bgColor = 'bg-red-50/95';
            iconColor = 'text-red-600';
            borderColor = 'border-red-200';
          } else if (t.type === 'warning') {
            Icon = AlertTriangle;
            bgColor = 'bg-amber-50/95';
            iconColor = 'text-amber-600';
            borderColor = 'border-amber-200';
          }

          return (
            <div
              key={t.id}
              className={`flex items-start gap-3 p-4 rounded-xl border ${borderColor} ${bgColor} ${textColor} shadow-lg pointer-events-auto backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-4`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${iconColor} mt-0.5`} />
              <div className="flex-1 text-xs font-semibold font-sans leading-relaxed">
                {t.message}
              </div>
              <button
                onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
                className="text-[#717971] hover:text-[#1c1c18] transition-colors p-0.5 rounded-lg hover:bg-black/5"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Custom Alert Modal */}
      {alertConfig && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#e5e2db] space-y-5 transform transition-all scale-100 font-sans text-center">
            <div className="flex justify-end -mt-2 -mr-2">
              <button
                onClick={() => alertConfig.resolve?.()}
                className="text-[#717971] hover:text-[#1c1c18] transition-colors cursor-pointer p-1 rounded-lg hover:bg-[#f6f3ec]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Icon Banner */}
            <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-surface-container">
              {alertConfig.type === 'success' && <CheckCircle2 className="text-emerald-600 w-7 h-7" />}
              {alertConfig.type === 'error' && <XCircle className="text-[#ba1a1a] w-7 h-7" />}
              {alertConfig.type === 'warning' && <AlertTriangle className="text-amber-600 w-7 h-7" />}
              {(alertConfig.type === 'info' || !alertConfig.type) && <Info className="text-[#144227] w-7 h-7" />}
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-extrabold text-[#1c1c18] tracking-tight">{alertConfig.title}</h3>
              <p className="text-xs text-[#414942] leading-relaxed font-medium">
                {alertConfig.message}
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => alertConfig.resolve?.()}
                className="w-full py-2.5 bg-[#144227] hover:bg-[#376847] text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                {alertConfig.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirm Modal */}
      {confirmConfig && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#e5e2db] space-y-5 transform transition-all scale-100 font-sans">
            <div className="flex items-center justify-between border-b border-[#e5e2db] pb-3">
              <div className="flex items-center gap-2">
                {confirmConfig.isDanger ? (
                  <AlertTriangle className="text-[#ba1a1a] w-5 h-5" />
                ) : (
                  <Info className="text-[#144227] w-5 h-5" />
                )}
                <h3 className="text-xs font-extrabold text-[#1c1c18]">{confirmConfig.title}</h3>
              </div>
              <button
                onClick={() => confirmConfig.resolve?.(false)}
                className="text-[#717971] hover:text-[#1c1c18] transition-colors cursor-pointer p-1 rounded-lg hover:bg-[#f6f3ec]"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-[#414942] font-semibold leading-relaxed">
              {confirmConfig.message}
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => confirmConfig.resolve?.(false)}
                className="w-1/2 py-2.5 border border-[#c1c9c0] rounded-xl text-xs font-bold text-[#414942] hover:bg-[#f6f3ec] transition-colors cursor-pointer"
              >
                {confirmConfig.cancelText}
              </button>
              <button
                type="button"
                onClick={() => confirmConfig.resolve?.(true)}
                className={`w-1/2 py-2.5 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                  confirmConfig.isDanger ? 'bg-[#ba1a1a] hover:bg-[#93000a]' : 'bg-[#144227] hover:bg-[#376847]'
                }`}
              >
                {confirmConfig.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}
