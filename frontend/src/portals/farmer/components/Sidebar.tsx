"use client";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LayoutDashboard, Sprout, Package, Handshake, ReceiptText, Settings, LogOut, X } from 'lucide-react';
import { View } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

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
    { id: 'settings' as View, label: 'Profile & Settings', icon: Settings },
  ];

  const handleNavClick = (id: View) => {
    onViewChange(id);
    onClose?.();
  };

  const sidebarContent = (
    <>
      <div className="mb-8 px-2 flex items-center justify-between">
        <div>
          <h1 className="font-sans text-2xl font-extrabold text-[#184b2d] tracking-tight">Harvest Hill</h1>
          <p className="font-mono text-[10px] text-[#8a9087] uppercase tracking-widest mt-1 opacity-70">Delivery Portal</p>
        </div>
        {/* Close button visible only on mobile overlay */}
        <button
          onClick={onClose}
          className="lg:hidden p-2 rounded-lg hover:bg-[#eef1eb] text-[#667067] transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-grow flex flex-col gap-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            className={cn(
              "flex items-center gap-3 py-2.5 px-3 rounded-xl transition-all duration-200 text-left group",
              activeView === item.id
                ? "bg-[#b7ebb8] text-[#234b32] border-l-4 border-[#184b2d] font-bold scale-[0.98]"
                : "text-[#59645c] hover:bg-[#eef1eb]"
            )}
          >
            <item.icon size={18} className={activeView === item.id ? "text-[#234b32]" : "text-[#59645c]"} />
            <span className="font-mono text-xs">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto border-t border-[#c9d0c6] pt-4">
        <button className="flex items-center gap-3 py-2.5 px-3 w-full rounded-xl text-[#59645c] hover:bg-[#eef1eb] transition-colors duration-200">
          <LogOut size={18} />
          <span className="font-mono text-xs">Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <aside className="w-56 h-[calc(100vh-64px)] fixed left-0 top-[64px] hidden lg:flex flex-col bg-[#f8f7f2] border-r border-[#d4d8d1] py-6 px-3 z-40">
      {sidebarContent}
    </aside>
  );
}
