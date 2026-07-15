"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Settings, Menu, X, Clock, Handshake, Package, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { CurrencyToggle } from '../../../components/CurrencyToggle';

interface TopBarProps {
  notifications: any[];
  unreadCount: number;
  onMarkAllRead: () => void;
  onMarkRead: (id: number) => void;
  onDelete: (id: number) => void;
  onDeleteAll: () => void;
  adminName: string;
  onMenuToggle: () => void;
  onSearchChange?: (val: string) => void;
}

function getNotifyIcon(title: string) {
  const t = (title || '').toLowerCase();
  if (t.includes('deal') || t.includes('agreement') || t.includes('negotiation')) return Handshake;
  if (t.includes('demand') || t.includes('product') || t.includes('harvest')) return Package;
  if (t.includes('alert') || t.includes('system')) return AlertCircle;
  return Bell;
}

function formatRelativeTime(dateStr: string) {
  if (!dateStr) return '';
  try {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export function TopBar({
  notifications,
  unreadCount,
  onMarkAllRead,
  onMarkRead,
  onDelete,
  onDeleteAll,
  adminName,
  onMenuToggle,
  onSearchChange,
}: TopBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    onSearchChange?.(val);
  };

  const unreadNotifs = notifications.filter(n => !n.is_read);
  const readNotifs = notifications.filter(n => n.is_read);

  return (
    <header className="h-14 flex items-center justify-between px-6 bg-white border-b border-outline-variant shrink-0 z-20">
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        <div className="relative w-full max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant transition-colors group-focus-within:text-primary" />
          <input 
            type="text" 
            placeholder="Search records, users, or orders..."
            value={searchValue}
            onChange={handleSearchChange}
            className="w-full h-9 pl-10 pr-4 bg-surface-container-low border-none rounded-full text-sm focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/60"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 relative" ref={dropdownRef}>
        <CurrencyToggle />
        <button 
          onClick={() => setIsOpen(prev => !prev)}
          className={cn(
            "p-2 rounded-full transition-all cursor-pointer relative",
            isOpen
              ? "bg-primary/10 text-primary"
              : "text-on-surface-variant hover:bg-surface-container-low"
          )}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white font-mono text-[8px] font-extrabold flex items-center justify-center rounded-full px-1 border-2 border-white shadow-sm" >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-all">
          <Settings className="w-5 h-5" />
        </button>
        
        {/* Notifications Dropdown */}
        {isOpen && (
          <div className="absolute right-0 top-[calc(100%+8px)] w-[340px] sm:w-[380px] bg-white/95 backdrop-blur-md border border-outline-variant rounded-2xl shadow-[0_20px_50px_rgba(20,66,39,0.15)] z-[80] overflow-hidden flex flex-col transition-all duration-300"
            style={{ maxHeight: '480px' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant bg-gradient-to-r from-primary to-primary-container text-white shrink-0">
              <div className="flex flex-col gap-0.5">
                <span className="font-sans text-sm font-extrabold block leading-none">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] text-white/80 font-mono mt-1 block">
                    {unreadCount} unread message{unreadCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => { onMarkAllRead(); }}
                      className="text-[11px] font-sans font-bold text-[#b6edc2] hover:text-white hover:underline transition-all cursor-pointer bg-transparent border-none p-0"
                      title="Mark all as read"
                    >
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={() => { onDeleteAll?.(); }}
                      className="text-[11px] font-sans font-bold text-red-200 hover:text-red-100 hover:underline transition-all cursor-pointer bg-transparent border-none p-0 ml-2"
                      title="Delete all notifications"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                /* Empty State */
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary animate-pulse">
                    <Bell size={28} />
                  </div>
                  <p className="font-sans text-sm font-extrabold text-on-surface">You are all caught up!</p>
                  <p className="font-sans text-xs text-on-surface-variant mt-1.5 max-w-[240px] mx-auto leading-relaxed">No new alerts. We'll let you know when negotiations update or payments clear.</p>
                </div>
              ) : (
                <>
                  {/* Unread Section */}
                  {unreadNotifs.length > 0 && (
                    <div>
                      <div className="px-5 py-2 bg-surface-container-low/70 border-b border-outline-variant/40 flex items-center justify-between">
                        <span className="font-mono text-[9px] uppercase tracking-widest font-bold text-primary">New Alerts</span>
                        <span className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                      </div>
                      {unreadNotifs.map(notify => {
                        const Icon = getNotifyIcon(notify.title);
                        return (
                          <div
                            key={notify.id}
                            onClick={() => onMarkRead(notify.id)}
                            className="flex gap-4.5 px-5 py-4 border-b border-outline-variant/40 bg-primary/[0.015] hover:bg-primary/[0.045] border-l-4 border-primary transition-all duration-200 cursor-pointer group"
                          >
                            <div className="mt-0.5 shrink-0 w-9 h-9 rounded-xl bg-[#b6edc2] flex items-center justify-center text-primary shadow-sm">
                              <Icon size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-sans text-xs font-extrabold text-primary leading-snug group-hover:text-[#2d5a3d] transition-colors">{notify.title || 'Alert'}</p>
                                <div className="flex items-center gap-1 shrink-0 text-on-surface-variant/70">
                                  <Clock size={10} />
                                  <span className="font-mono text-[9px] whitespace-nowrap">
                                    {formatRelativeTime(notify.created_at)}
                                  </span>
                                </div>
                              </div>
                              <p className="font-sans text-[11px] text-on-surface-variant mt-1 leading-relaxed">{notify.message}</p>
                              <div className="flex gap-3 mt-2">
                                <button
                                  onClick={e => { e.stopPropagation(); onMarkRead(notify.id); }}
                                  className="text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer font-mono text-[9px] font-bold uppercase hover:underline p-0 border-none bg-transparent"
                                >
                                  Mark read
                                </button>
                                <button
                                  onClick={e => { e.stopPropagation(); onDelete?.(notify.id); }}
                                  className="text-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer font-mono text-[9px] font-bold uppercase hover:underline p-0 border-none bg-transparent"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Read Section */}
                  {readNotifs.length > 0 && (
                    <div>
                      <div className="px-5 py-2 bg-surface-container-low/75 border-b border-outline-variant/40">
                        <span className="font-mono text-[9px] uppercase tracking-widest font-bold text-on-surface-variant">Earlier</span>
                      </div>
                      {readNotifs.map(notify => {
                        const Icon = getNotifyIcon(notify.title);
                        return (
                          <div
                            key={notify.id}
                            className="flex gap-4.5 px-5 py-4 border-b border-outline-variant/30 hover:bg-surface-container-low/50 transition-all duration-200 border-l-4 border-transparent group"
                          >
                            <div className="mt-0.5 shrink-0 w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-outline shadow-sm">
                              <Icon size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-sans text-xs font-bold text-on-surface-variant leading-snug">{notify.title || 'Alert'}</p>
                                <div className="flex items-center gap-1 shrink-0 text-on-surface-variant/50">
                                  <Clock size={10} />
                                  <span className="font-mono text-[9px] whitespace-nowrap">
                                    {formatRelativeTime(notify.created_at)}
                                  </span>
                                </div>
                              </div>
                              <p className="font-sans text-[11px] text-on-surface-variant/75 mt-1 leading-relaxed">{notify.message}</p>
                              <div className="flex gap-3 mt-2">
                                <button
                                  onClick={e => { e.stopPropagation(); onDelete?.(notify.id); }}
                                  className="text-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer font-mono text-[9px] font-bold uppercase hover:underline p-0 border-none bg-transparent"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        <div className="h-6 w-px bg-outline-variant mx-2" />
        
        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold leading-none">{adminName || 'Admin'}</p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-tighter mt-1">Supply Chain Admin</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-outline-variant flex items-center justify-center font-bold text-xs shadow-sm cursor-pointer hover:bg-primary/20 transition-all">
            {(adminName || 'A').charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
