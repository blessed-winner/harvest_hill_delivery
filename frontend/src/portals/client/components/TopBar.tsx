import React, { useEffect, useState, useRef } from 'react';
import { User, History, Bell, ShoppingCart, Menu, X, Clock, Handshake, Package, AlertCircle, Search } from 'lucide-react';
import Link from 'next/link';
import { clientApi } from '../lib/api';
import { CurrencyToggle } from '../../../components/CurrencyToggle';
import { DefaultProfileAvatar } from '../../../components/DefaultProfileAvatar';

interface TopBarProps {
  activeScreen: string;
  onNavigate: (screen: string, category?: string, productId?: number, querySearch?: string) => void;
  cartCount: number;
  onMenuClick?: () => void;
}

function getNotifyIcon(title: string) {
  const t = (title || '').toLowerCase();
  if (t.includes('deal') || t.includes('agreement') || t.includes('negotiation') || t.includes('order')) return Handshake;
  if (t.includes('demand') || t.includes('product') || t.includes('harvest') || t.includes('stock')) return Package;
  if (t.includes('alert') || t.includes('dispute') || t.includes('system')) return AlertCircle;
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

export default function TopBar({ activeScreen, onNavigate, cartCount, onMenuClick }: TopBarProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const [searchCategory, setSearchCategory] = useState('all');
  const [topSearchTerm, setTopSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleScroll = (id: string) => {
    if (activeScreen !== 'landing') {
      onNavigate('landing');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const loadNotifications = async () => {
    try {
      const data = await clientApi.notifications.list();
      setNotifications(Array.isArray(data) ? data : data?.results || []);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  const loadProfilePhoto = async () => {
    try {
      const data = await clientApi.profile.get();
      setProfilePhoto(data.avatar || data.profile?.avatar || null);
    } catch {}
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      const role = localStorage.getItem('user_role');
      setIsLoggedIn(!!token);
      setUserRole(role);
      if (token) {
        loadProfilePhoto();
        loadNotifications();
        const interval = setInterval(loadNotifications, 30000);

        const handleAuthChanged = () => {
          const freshToken = localStorage.getItem('access_token');
          setIsLoggedIn(!!freshToken);
          if (!freshToken) setNotifications([]);
        };

        window.addEventListener('profile-updated', handleProfileUpdated);
        window.addEventListener('auth-changed', handleAuthChanged);

        return () => {
          clearInterval(interval);
          window.removeEventListener('profile-updated', handleProfileUpdated);
          window.removeEventListener('auth-changed', handleAuthChanged);
        };
      }
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsNotifyOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id: number | string) => {
    try {
      await clientApi.notifications.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error("Failed to mark read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await clientApi.notifications.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  const handleDeleteNotif = async (id: number | string) => {
    try {
      await clientApi.notifications.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const handleDeleteAllNotifs = async () => {
    try {
      await clientApi.notifications.deleteAll();
      setNotifications([]);
    } catch (err) {
      console.error("Failed to delete all notifications:", err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const unreadNotifs = notifications.filter(n => !n.is_read);
  const readNotifs = notifications.filter(n => n.is_read);

  return (
    <header className="bg-white border-b border-[#e5e2db] py-3.5 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
        {/* Brand Logo & Menu Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-1.5 hover:bg-[#f0eee7] rounded-lg transition-colors cursor-pointer"
              title="Toggle Menu"
            >
              <Menu className="h-5 w-5 text-[#414942]" />
            </button>
          )}
          <button
            onClick={() => onNavigate('landing')}
            className="text-xl sm:text-2xl font-bold text-[#144227] tracking-tight font-sans hover:opacity-85 transition-opacity cursor-pointer"
          >
            Harvest Hill
          </button>
        </div>

        {/* Working TopNav Search Bar */}
        <div className="flex-1 max-w-xl mx-4 hidden md:flex items-center">
          <div className="flex w-full bg-[#f0eee7] border border-[#c1c9c0] rounded-xl overflow-hidden shadow-inner">
            <select 
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
              className="bg-transparent text-xs font-bold px-3 text-[#414942] border-r border-[#c1c9c0] outline-none cursor-pointer"
            >
              <option value="all">All</option>
              <option value="Fruits">Fruits</option>
              <option value="Vegetables">Vegetables</option>
              <option value="Animal-Based">Animal-Based</option>
              <option value="Grains">Grains</option>
            </select>
            <input
              type="text"
              value={topSearchTerm}
              onChange={(e) => setTopSearchTerm(e.target.value)}
              placeholder="Search for fresh produce, dairy, or meats..."
              className="flex-1 bg-transparent px-3 py-2 text-xs text-[#1c1c18] focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onNavigate('catalog', searchCategory !== 'all' ? searchCategory : undefined, undefined, topSearchTerm);
                }
              }}
            />
            <button 
              onClick={() => onNavigate('catalog', searchCategory !== 'all' ? searchCategory : undefined, undefined, topSearchTerm)}
              className="bg-[#144227] text-white px-4 py-2 hover:bg-[#376847] transition-colors cursor-pointer flex items-center justify-center"
            >
              <Search size={15} />
            </button>
          </div>
        </div>

        {/* Category Nav Links */}
        <nav className="hidden lg:flex items-center gap-5 overflow-x-auto py-1 scrollbar-hide text-xs font-semibold text-[#414942]">
          <button onClick={() => onNavigate('landing')} className="hover:text-[#144227] cursor-pointer font-bold">Home</button>
          <button onClick={() => onNavigate('faq')} className="hover:text-[#144227] cursor-pointer font-bold">FAQ</button>
        </nav>

        {/* Right Action Bar */}
        <div className="flex items-center justify-end gap-2.5 sm:gap-4 shrink-0">
          {/* Action Icons / Login options */}
          <div className="flex items-center gap-2.5 sm:gap-4 text-[#414942]">
            {isLoggedIn ? (
              <>
                {/* Profile */}
                <button
                  onClick={() => {
                    const role = typeof window !== 'undefined' ? localStorage.getItem('user_role') : null;
                    if (role === 'farmer') {
                      window.location.href = '/farmer?view=settings';
                    } else if (role === 'admin') {
                      window.location.href = '/admin?tab=settings';
                    } else {
                      onNavigate('dashboard');
                    }
                  }}
                  className="p-1 hover:bg-[#f0eee7] rounded-full transition-colors cursor-pointer flex items-center justify-center"
                  title="Profile Settings"
                >
                  {profilePhoto ? (
                    <img src={profilePhoto} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-[#c1c9c0]" />
                  ) : (
                    <DefaultProfileAvatar className="w-8 h-8 hover:scale-105 transition-transform" />
                  )}
                </button>

                {/* Notifications Engine Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsNotifyOpen(prev => !prev)}
                    className="p-2 hover:bg-[#f0eee7] rounded-full transition-colors relative cursor-pointer"
                    title="Notifications"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 min-w-[16px] h-[16px] bg-[#ba1a1a] text-white font-mono text-[8px] font-extrabold flex items-center justify-center rounded-full px-1 border-2 border-white shadow-sm">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown Box */}
                  {isNotifyOpen && (
                    <div className="absolute right-0 top-[calc(100%+8px)] w-[320px] sm:w-[360px] bg-white border border-[#e5e2db] rounded-2xl shadow-2xl z-[80] overflow-hidden flex flex-col font-sans transition-all">
                      {/* Header */}
                      <div className="flex items-center justify-between px-5 py-3.5 bg-[#144227] text-white shrink-0">
                        <div>
                          <span className="font-extrabold text-sm block">Notifications</span>
                          {unreadCount > 0 && (
                            <span className="text-[10px] text-white/80 font-medium">{unreadCount} unread message{unreadCount > 1 ? 's' : ''}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {unreadCount > 0 && (
                            <button
                              onClick={handleMarkAllRead}
                              className="text-[10px] font-bold text-[#bceec8] hover:underline cursor-pointer"
                            >
                              Mark all read
                            </button>
                          )}
                          {notifications.length > 0 && (
                            <button
                              onClick={handleDeleteAllNotifs}
                              className="text-[10px] font-bold text-red-200 hover:underline cursor-pointer"
                            >
                              Clear all
                            </button>
                          )}
                          <button onClick={() => setIsNotifyOpen(false)} className="text-white/70 hover:text-white cursor-pointer">
                            <X size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="max-h-[360px] overflow-y-auto divide-y divide-[#f0eee7]">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-xs text-[#717971] space-y-2">
                            <Bell className="w-8 h-8 text-[#144227] mx-auto opacity-30 animate-pulse" />
                            <p className="font-bold text-[#1c1c18]">No new notifications</p>
                            <p className="text-[10px]">Order updates and shipment delivery notes will appear here.</p>
                          </div>
                        ) : (
                          <>
                            {unreadNotifs.length > 0 && (
                              <div>
                                <div className="px-4 py-1.5 bg-[#f6f3ec] text-[9px] uppercase font-extrabold tracking-wider text-[#144227]">
                                  New Alerts
                                </div>
                                {unreadNotifs.map(n => {
                                  const Icon = getNotifyIcon(n.title);
                                  return (
                                    <div
                                      key={n.id}
                                      onClick={() => handleMarkRead(n.id)}
                                      className="p-4 bg-[#144227]/5 hover:bg-[#144227]/10 border-l-4 border-[#144227] transition-colors cursor-pointer group"
                                    >
                                      <div className="flex items-start gap-3">
                                        <div className="w-7 h-7 rounded-lg bg-[#bceec8] text-[#144227] flex items-center justify-center shrink-0 mt-0.5">
                                          <Icon size={14} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between gap-2">
                                            <p className="text-xs font-bold text-[#144227] truncate">{n.title || 'Notification'}</p>
                                            <span className="text-[9px] text-[#717971] shrink-0">{formatRelativeTime(n.created_at)}</span>
                                          </div>
                                          <p className="text-[11px] text-[#414942] mt-0.5 leading-relaxed">{n.message}</p>
                                          <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={(e) => { e.stopPropagation(); handleMarkRead(n.id); }} className="text-[9px] font-bold text-[#144227] hover:underline cursor-pointer">Mark read</button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteNotif(n.id); }} className="text-[9px] font-bold text-red-600 hover:underline cursor-pointer">Delete</button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {readNotifs.length > 0 && (
                              <div>
                                <div className="px-4 py-1.5 bg-[#f6f3ec] text-[9px] uppercase font-extrabold tracking-wider text-[#717971]">
                                  Earlier
                                </div>
                                {readNotifs.map(n => {
                                  const Icon = getNotifyIcon(n.title);
                                  return (
                                    <div key={n.id} className="p-4 hover:bg-[#f6f3ec]/50 transition-colors group">
                                      <div className="flex items-start gap-3">
                                        <div className="w-7 h-7 rounded-lg bg-[#f0eee7] text-[#717971] flex items-center justify-center shrink-0 mt-0.5">
                                          <Icon size={14} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between gap-2">
                                            <p className="text-xs font-bold text-[#414942] truncate">{n.title || 'Notification'}</p>
                                            <span className="text-[9px] text-[#717971] shrink-0">{formatRelativeTime(n.created_at)}</span>
                                          </div>
                                          <p className="text-[11px] text-[#717971] mt-0.5 leading-relaxed">{n.message}</p>
                                          <button onClick={(e) => { e.stopPropagation(); handleDeleteNotif(n.id); }} className="text-[9px] font-bold text-red-600 hover:underline mt-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">Delete</button>
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
                </div>

                {/* Shopping Cart - Always visible for guests and clients */}
                <button
                  onClick={() => onNavigate('cart')}
                  className="p-2 hover:bg-[#f0eee7] rounded-full transition-colors relative cursor-pointer"
                  title="Harvest Cart"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 bg-[#144227] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {cartCount}
                  </span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                {/* Shopping Cart for Guest Users */}
                <button
                  onClick={() => onNavigate('cart')}
                  className="p-2 hover:bg-[#f0eee7] rounded-full transition-colors relative cursor-pointer"
                  title="Harvest Cart"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 bg-[#144227] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {cartCount}
                  </span>
                </button>

                <Link
                  href="/login"
                  className="text-[#144227] font-semibold text-xs hover:underline cursor-pointer"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-[#144227] text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-[#376847] transition-colors cursor-pointer"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
