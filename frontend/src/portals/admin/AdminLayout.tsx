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
import { ViewType } from '../types';
import { api, apiRequest } from './lib/api';
import { cn } from './lib/utils';

function renderView(view: ViewType, searchTerm: string) {
  switch (view) {
    case 'users':
      return <UserManagement searchTerm={searchTerm} />;
    case 'products':
      return <ProductCatalog searchTerm={searchTerm} />;
    case 'orders':
      return <OrdersManagement searchTerm={searchTerm} />;
    case 'deliveries':
      return <DeliveryNotes searchTerm={searchTerm} />;
    case 'invoices':
      return <Invoices searchTerm={searchTerm} />;
    case 'supplies':
      return <Supplies searchTerm={searchTerm} />;
    case 'reports':
      return <Reports />;
    case 'dashboard':
    default:
      return <Dashboard />;
  }
}

export default function AdminLayout() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [adminName, setAdminName] = useState('Admin');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch admin name
  useEffect(() => {
    let mounted = true;
    api.me()
      .then(res => {
        if (mounted && res) {
          setAdminName(res.username || res.email || 'Admin');
        }
      })
      .catch(err => console.error("Failed to load admin profile:", err));
    return () => { mounted = false; };
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

        socket = new WebSocket(`ws://localhost:8000/ws/notifications/?token=${token}`);

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
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAllRead={handleMarkAllRead}
          onMarkRead={handleMarkRead}
          onDelete={handleDelete}
          onDeleteAll={handleDeleteAll}
          adminName={adminName}
          onMenuToggle={() => setIsMobileMenuOpen(prev => !prev)}
          onSearchChange={setSearchTerm}
        />
        <main className="flex-grow min-w-0 overflow-y-auto">
          {renderView(currentView, searchTerm)}
        </main>
      </div>
    </div>
  );
}
