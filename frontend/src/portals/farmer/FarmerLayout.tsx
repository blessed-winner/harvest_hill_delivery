"use client";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode, useState } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import { View } from '../types';
import { cn } from '../lib/utils';
import { LayoutDashboard, Sprout, Package, Handshake, Settings, ReceiptText } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  activeView: View;
  onViewChange: (view: View) => void;
}

const mobileNavItems = [
  { id: 'dashboard' as View, label: 'Home', icon: LayoutDashboard },
  { id: 'submit' as View, label: 'Submit', icon: Sprout },
  { id: 'supplies' as View, label: 'Supplies', icon: Package },
  { id: 'negotiations' as View, label: 'Deals', icon: Handshake },
  { id: 'invoices' as View, label: 'Invoices', icon: ReceiptText },
  { id: 'settings' as View, label: 'Settings', icon: Settings },
];

export default function Layout({ children, activeView, onViewChange }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

      <div className="flex-grow flex flex-col min-w-0 lg:pl-[260px]">
        <TopBar onMenuToggle={() => setIsMobileMenuOpen((prev) => !prev)} />
        <main className="flex-grow min-w-0 overflow-x-hidden p-6 pb-20 lg:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
