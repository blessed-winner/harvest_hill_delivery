"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Dashboard } from './pages/Dashboard';
import { UserManagement } from './pages/UserManagement';
import { ProductCatalog } from './pages/ProductCatalog';
import { OrdersManagement } from './pages/OrdersManagement';
import { DeliveryNotes } from './pages/DeliveryNotes';
import { Invoices } from './pages/Invoices';
import { Supplies } from './pages/Supplies';
import { Reports } from './pages/Reports';
import { SettingsPage } from './pages/Settings';
import { ViewType } from '../types';
import { api, apiRequest } from './lib/api';
import { cn } from './lib/utils';
import { CurrencyProvider } from '../../context/CurrencyContext';

export default function AdminLayout() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [adminName, setAdminName] = useState('Admin');
  const [adminPhoto, setAdminPhoto] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Render view locally inside AdminLayout to easily capture profile updates
  const renderView = (view: ViewType) => {
    switch (view) {
      case 'users':
        return <UserManagement />;
      case 'products':
        return <ProductCatalog />;
      case 'orders':
        return <OrdersManagement />;
      case 'deliveries':
        return <DeliveryNotes />;
      case 'invoices':
        return <Invoices />;
      case 'supplies':
        return <Supplies />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return (
          <SettingsPage 
            onProfileUpdate={(name, photo) => {
              setAdminName(name);
              setAdminPhoto(photo);
            }} 
          />
        );
      case 'dashboard':
      default:
        return <Dashboard />;
    }
  };

  // Fetch admin name & photo
  useEffect(() => {
    let mounted = true;
    api.me()
      .then(res => {
        if (mounted && res) {
          const name = `${res.first_name || ''} ${res.last_name || ''}`.trim() || res.username || res.email || 'Admin';
          setAdminName(name);
          setAdminPhoto(res.photo || res.avatar || null);
        }
      })
      .catch(err => console.error("Failed to load admin profile:", err));
    return () => { mounted = false; };
  }, []);

  // Listen to admin settings changes (triggered by SettingsPage saving)
  useEffect(() => {
    const checkSettings = () => {
      const enabled = localStorage.getItem('admin_notifications_enabled') !== 'false';
      setNotificationsEnabled(enabled);
    };
    checkSettings();
    window.addEventListener('admin_settings_changed', checkSettings);
    return () => window.removeEventListener('admin_settings_changed', checkSettings);
  }, []);

  // Notifications logic
  useEffect(() => {
    let socket: WebSocket | null = null;
    let mounted = true;

    async function initNotifications() {
      try {
        const list = await api.notifications();
        if (!mounted) return;
        setNotifications(list || []);
        setUnreadCount((list || []).filter((n: any) => !n.is_read).length);
      } catch (err) {
        console.error("Failed to load notifications history:", err);
      }

      // Establish WebSocket connection
      if (typeof window !== 'undefined') {
        const token = window.localStorage.getItem('access_token') || window.localStorage.getItem('accessToken');
        if (!token) return;

        socket = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/ws/notifications/?token=${token}`);

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (!mounted) return;
            setNotifications(prev => [data, ...prev]);
            setUnreadCount(prev => prev + 1);
          } catch (err) {
            console.error("Error parsing WebSocket message:", err);
          }
        };

        socket.onclose = () => {
          console.log("Notification socket closed");
        };
      }
    }

    initNotifications();

    return () => {
      mounted = false;
      if (socket) socket.close();
    };
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await api.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(prev - 1, 0));
    } catch (err) {
      console.error("Failed to mark single notification as read:", err);
    }
  };

  const handleDeleteAll = async () => {
    try {
      await api.deleteAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to delete all notifications:", err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => {
        const deletedNotif = notifications.find(n => n.id === id);
        if (deletedNotif && !deletedNotif.is_read) {
          return Math.max(prev - 1, 0);
        }
        return prev;
      });
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  return (
    <CurrencyProvider>
    <div className="min-h-screen flex bg-surface">
      {/* Backdrop for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <Sidebar 
        currentView={currentView} 
        onViewChange={(view) => {
          setCurrentView(view);
          setIsMobileMenuOpen(false);
        }}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      <div className="flex-grow flex flex-col min-w-0 lg:pl-[260px] h-screen overflow-hidden">
        <TopBar 
          notifications={notificationsEnabled ? notifications : []}
          unreadCount={notificationsEnabled ? unreadCount : 0}
          onMarkAllRead={handleMarkAllRead}
          onMarkRead={handleMarkRead}
          onDelete={handleDelete}
          onDeleteAll={handleDeleteAll}
          adminName={adminName}
          adminPhoto={adminPhoto}
          onNavigate={(view) => setCurrentView(view)}
          onMenuToggle={() => setIsMobileMenuOpen(prev => !prev)}
        />
        <main className="flex-grow min-w-0 overflow-y-auto">
          {renderView(currentView)}
        </main>
      </div>
    </div>
    </CurrencyProvider>
  );
}
