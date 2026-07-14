"use client";

import React from 'react';
import { 
  LayoutDashboard, 
  Sprout, 
  Package, 
  Handshake, 
  ReceiptText, 
  Settings, 
  LogOut, 
  X,
  UserCircle
} from 'lucide-react';
import { View } from '../../types';
import { cn } from '../lib/utils';

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ activeView, onViewChange, isOpen = false, onClose }: SidebarProps) {
  const navItems = [
    { id: 'dashboard' as View, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'submit' as View, label: 'Submit Harvest', icon: Sprout },
    { id: 'supplies' as View, label: 'My Supplies', icon: Package },
    { id: 'negotiations' as View, label: 'Negotiations', icon: Handshake },
    { id: 'invoices' as View, label: 'Invoices & Payments', icon: ReceiptText },
  ];

  const handleNavClick = (id: View) => {
    onViewChange(id);
    onClose?.();
  };

  return (
    <aside className={cn(
      "w-56 h-[calc(100vh-64px)] fixed left-0 top-[64px] flex flex-col bg-primary border-r border-white/10 py-6 px-3 z-40 transition-all duration-300",
      isOpen ? "translate-x-0" : "hidden lg:flex"
    )}>
      {/* Branding */}
      <div className="px-2 mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white leading-tight font-sans">Harvest Hill</h1>
          <p className="text-[10px] uppercase tracking-widest text-white/60 font-bold font-mono">Delivery Portal</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            className={cn(
              "w-full flex items-center px-4 py-2.5 rounded-lg transition-all group text-left cursor-pointer",
              activeView === item.id 
                ? "bg-primary-container text-on-primary-container font-semibold" 
                : "text-white/80 hover:text-white hover:bg-primary-container/20"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5 mr-3 transition-colors",
              activeView === item.id ? "text-on-primary-container" : "text-white/60 group-hover:text-white"
            )} size={20} />
            <span className="text-sm font-sans">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer / Profile */}
      <div className="mt-auto px-4 pt-4 border-t border-white/10 space-y-1 shrink-0">
        <button 
          onClick={() => handleNavClick('settings')}
          className={cn(
            "w-full flex items-center px-4 py-2.5 rounded-lg transition-all group text-left cursor-pointer",
            activeView === 'settings'
              ? "bg-primary-container text-on-primary-container font-semibold"
              : "text-white/80 hover:text-white hover:bg-primary-container/20"
          )}
        >
          <UserCircle className="w-5 h-5 mr-3 text-white/60 group-hover:text-white" size={20} />
          <span className="text-sm font-sans">Farmer Profile</span>
        </button>
        <button className="w-full flex items-center px-4 py-2.5 text-white/80 hover:text-white hover:bg-primary-container/20 rounded-lg transition-colors text-left cursor-pointer">
          <LogOut className="w-5 h-5 mr-3 text-white/60" size={20} />
          <span className="text-sm font-sans">Logout</span>
        </button>
      </div>
    </aside>
  );
}

