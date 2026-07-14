"use client";

import { useEffect, useState, useRef } from 'react';
import { Bell, Menu, CheckCheck, Check, Clock, AlertCircle, Handshake, Package, X } from 'lucide-react';
import { api } from '../lib/api';
import { cn } from '../lib/utils';

interface TopBarProps {
  activeView?: string;
  onMenuToggle: () => void;
  notifications: any[];
  unreadCount: number;
  onMarkAllRead: () => void;
  onMarkRead: (id: number) => void;
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

export default function TopBar({ 
  activeView, 
  onMenuToggle,
  notifications,
  unreadCount,
  onMarkAllRead,
  onMarkRead
}: TopBarProps) {
  const [farmName, setFarmName] = useState('Green Valley Farm');
  const [roleLabel, setRoleLabel] = useState('Tier 1 Supplier');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const profileImage =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuC9re6yJPQ5TYt9TGg1Mt0-bI4EtsJFQjADaJ-AwucfipGIVS_n3JHlVfqhYm5ByV0h5A3ex6xXqVx_l3oBhemoxWVhA0IPAGluGjQO4OPoJ9gQdqnssN5XJBPp5OFVC7xQElJLs4enHGBVPXJAWBIS1VNjcQowBBzGU4M_b4cPWpbY3sw7Bu_wCsn5_rNTUAiuiqPMd8LwtDezfTQ-Zehk2fUY53IVBnoVJaGfWMQAjI0XQr03PQqA9Q';

  const viewTitles: Record<string, string> = {
    dashboard: 'Dashboard Overview',
    submit: 'Submit New Harvest',
    supplies: 'My Supplies',
    negotiations: 'Negotiations & Deals',
    invoices: 'Invoices & Payments',
    settings: 'Farmer Profile & Settings',
  };

  const activeTitle = activeView ? viewTitles[activeView] || 'Farmer Portal' : 'Farmer Portal';

  useEffect(() => {
    let mounted = true;
    async function loadProfile() {
      try {
        const profile = await api.farmerProfile();
        if (!mounted) return;
        setFarmName(profile.farm_name || profile.user?.username || 'Green Valley Farm');
        setRoleLabel(profile.user?.role ? `${String(profile.user.role).toUpperCase()} Supplier` : 'Tier 1 Supplier');
      } catch {}
    }
    loadProfile();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Separate unread vs read
  const unreadNotifs = notifications.filter(n => !n.is_read);
  const readNotifs = notifications.filter(n => n.is_read);

  return (
    <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-white border-b border-outline-variant shrink-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>
        <h2 className="font-sans text-sm sm:text-base font-bold text-primary">{activeTitle}</h2>
      </div>

      <div className="flex items-center gap-3 sm:gap-6 relative" ref={dropdownRef}>
        {/* Bell Button */}
        <button
          onClick={() => setIsOpen(prev => !prev)}
          className={cn(
            "p-2 rounded-full transition-all cursor-pointer relative",
            isOpen
              ? "bg-primary/10 text-primary"
              : "text-on-surface-variant hover:bg-surface-container-low"
          )}
          aria-label="Notifications"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-error text-white font-mono text-[8px] font-extrabold flex items-center justify-center rounded-full px-1 border-2 border-white shadow-sm">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Notifications Dropdown */}
        {isOpen && (
          <div className="absolute right-0 top-[calc(100%+8px)] w-[340px] sm:w-[380px] bg-white border border-outline-variant rounded-2xl shadow-2xl z-[80] overflow-hidden flex flex-col"
            style={{ maxHeight: '480px' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant bg-surface-container-low shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Bell size={14} className="text-primary" />
                </div>
                <span className="font-sans text-sm font-extrabold text-on-surface">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-error text-white font-mono text-[9px] font-bold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={() => { onMarkAllRead(); }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                    title="Mark all as read"
                  >
                    <CheckCheck size={13} />
                    <span className="font-mono text-[9px] font-extrabold uppercase">All read</span>
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-on-surface-variant hover:text-on-surface rounded-lg transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                /* Empty State */
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center mb-4">
                    <Bell size={24} className="text-outline" />
                  </div>
                  <p className="font-sans text-sm font-bold text-on-surface">All caught up!</p>
                  <p className="font-sans text-xs text-on-surface-variant mt-1">No notifications yet. We'll let you know when something happens.</p>
                </div>
              ) : (
                <>
                  {/* Unread Section */}
                  {unreadNotifs.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-surface-container-low/50 border-b border-outline-variant/50">
                        <span className="font-mono text-[9px] uppercase tracking-widest font-bold text-on-surface-variant">New</span>
                      </div>
                      {unreadNotifs.map(notify => {
                        const Icon = getNotifyIcon(notify.title);
                        return (
                          <div
                            key={notify.id}
                            onClick={() => onMarkRead(notify.id)}
                            className="flex gap-3 px-4 py-3.5 border-b border-outline-variant/60 bg-primary/[0.03] hover:bg-primary/[0.06] transition-colors cursor-pointer group"
                          >
                            <div className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Icon size={15} className="text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-sans text-xs font-extrabold text-on-surface leading-snug">{notify.title || 'Alert'}</p>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Clock size={10} className="text-on-surface-variant" />
                                  <span className="font-mono text-[9px] text-on-surface-variant whitespace-nowrap">
                                    {formatRelativeTime(notify.created_at)}
                                  </span>
                                </div>
                              </div>
                              <p className="font-sans text-[11px] text-on-surface-variant mt-1 leading-relaxed">{notify.message}</p>
                              <button
                                onClick={e => { e.stopPropagation(); onMarkRead(notify.id); }}
                                className="mt-1.5 flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              >
                                <Check size={11} />
                                <span className="font-mono text-[9px] font-bold uppercase">Mark read</span>
                              </button>
                            </div>
                            <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Read Section */}
                  {readNotifs.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-surface-container-low/50 border-b border-outline-variant/50">
                        <span className="font-mono text-[9px] uppercase tracking-widest font-bold text-on-surface-variant">Earlier</span>
                      </div>
                      {readNotifs.map(notify => {
                        const Icon = getNotifyIcon(notify.title);
                        return (
                          <div
                            key={notify.id}
                            className="flex gap-3 px-4 py-3.5 border-b border-outline-variant/40 hover:bg-surface-container-low/60 transition-colors"
                          >
                            <div className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-surface-container flex items-center justify-center">
                              <Icon size={15} className="text-on-surface-variant" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-sans text-xs font-bold text-on-surface-variant leading-snug">{notify.title || 'Alert'}</p>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Clock size={10} className="text-on-surface-variant/60" />
                                  <span className="font-mono text-[9px] text-on-surface-variant/60 whitespace-nowrap">
                                    {formatRelativeTime(notify.created_at)}
                                  </span>
                                </div>
                              </div>
                              <p className="font-sans text-[11px] text-on-surface-variant/70 mt-1 leading-relaxed">{notify.message}</p>
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

        {/* Profile */}
        <div className="flex items-center gap-3 border-l border-outline-variant pl-3 sm:pl-5 cursor-pointer group">
          <div className="text-right hidden sm:block">
            <p className="font-mono text-xs font-bold text-on-surface">{farmName}</p>
            <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">{roleLabel}</p>
          </div>
          <img
            src={profileImage}
            alt="Farm profile"
            className="w-9 h-9 rounded-full border-2 border-primary object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </div>
    </header>
  );
}
