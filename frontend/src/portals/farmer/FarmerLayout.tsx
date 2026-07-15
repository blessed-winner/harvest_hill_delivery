"use client";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode, useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import { View } from '../types';
import { cn } from '../lib/utils';
import { api, apiRequest } from './lib/api';

interface LayoutProps {
  children: ReactNode;
  activeView: View;
  onViewChange: (view: View) => void;
}

export default function Layout({ children, activeView, onViewChange }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

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
            // Append incoming notification at the front
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
      await apiRequest('/api/notifications/mark-all-read/', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await apiRequest(`/api/notifications/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ is_read: true })
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(prev - 1, 0));
    } catch (err) {
      console.error("Failed to mark single notification as read:", err);
    }
  };

  const handleDeleteAll = async () => {
    try {
      await apiRequest('/api/notifications/delete-all/', { method: 'DELETE' });
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to delete all notifications:", err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiRequest(`/api/notifications/${id}/`, { method: 'DELETE' });
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
        activeView={activeView}
        onViewChange={onViewChange}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      <div className="flex-grow flex flex-col min-w-0 lg:pl-[260px] h-screen overflow-hidden">
        <TopBar 
          activeView={activeView} 
          onMenuToggle={() => setIsMobileMenuOpen((prev) => !prev)} 
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAllRead={handleMarkAllRead}
          onMarkRead={handleMarkRead}
          onDelete={handleDelete}
          onDeleteAll={handleDeleteAll}
        />
        <main className={cn(
          "flex-grow min-w-0",
          activeView === 'negotiations' ? "h-[calc(100vh-64px)] overflow-hidden p-0" : "overflow-y-auto p-6 pb-20 lg:pb-8"
        )}>
          {children}
        </main>
      </div>
    </div>
  );
}
