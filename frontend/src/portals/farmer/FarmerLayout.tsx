"use client";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode, useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
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
    <div className="flex min-h-screen overflow-x-hidden">
      <Sidebar
        activeView={activeView}
        onViewChange={onViewChange}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      <div className="flex-grow flex flex-col min-w-0">
        <TopBar onMenuToggle={() => setIsMobileMenuOpen((prev) => !prev)} />
        <main className="mt-[64px] lg:pl-[224px] pb-20 lg:pb-8 min-w-0">
          {children}
        </main>
      </div>
      
      {/* Mobile Bottom Nav — visible below lg */}
      <nav className="fixed bottom-0 w-full z-50 lg:hidden bg-surface-container-lowest border-t border-outline-variant shadow-lg">
        <div className="flex justify-around items-center h-16 px-1 w-full">
          {mobileNavItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition-all duration-300 min-w-0 relative flex-1",
                activeView === item.id 
                  ? "text-primary scale-105" 
                  : "text-on-surface-variant/80 hover:text-on-surface"
              )}
            >
              {activeView === item.id && (
                <span className="absolute top-0 w-8 h-[3px] bg-primary rounded-full" />
              )}
              <item.icon size={18} strokeWidth={activeView === item.id ? 2.5 : 2} className={activeView === item.id ? "text-primary" : "text-on-surface-variant/80"} />
              <span className="text-[8px] font-extrabold uppercase tracking-tighter leading-none">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
