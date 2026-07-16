import React from 'react';
import { LayoutDashboard, ShoppingBag, Package, Heart, Settings, Menu, X, ShoppingCart, User, Bell } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ClientView } from '../ClientLayout';

interface SidebarProps {
  currentView: ClientView;
  onViewChange: (view: ClientView) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const navItems = [
  { id: 'dashboard' as ClientView, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'browse' as ClientView, label: 'Browse Products', icon: ShoppingBag },
  { id: 'orders' as ClientView, label: 'My Orders', icon: Package },
  { id: 'favorites' as ClientView, label: 'Favorites', icon: Heart },
  { id: 'cart' as ClientView, label: 'Shopping Cart', icon: ShoppingCart, badge: 2 },
  { id: 'settings' as ClientView, label: 'Settings', icon: Settings },
];

export default function Sidebar({ currentView, onViewChange, isOpen, onToggle }: SidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={onToggle}
        />
      )}

      {/* Floating Sidebar */}
      <aside
        className={cn(
          "fixed top-4 left-4 bottom-4 z-50 w-72 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-outline-variant flex flex-col transition-all duration-300",
          isOpen ? "translate-x-0" : "-translate-x-[calc(100%+1rem)] lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-outline-variant">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm">HH</span>
              </div>
              <div>
                <h3 className="font-bold text-primary">Harvest Hill</h3>
                <p className="text-xs text-on-surface-variant">Client Portal</p>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="lg:hidden p-2 hover:bg-surface-container rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Card */}
          <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-on-surface truncate">Arthur Pemberton</p>
              <p className="text-xs text-on-surface-variant truncate">Executive Chef</p>
            </div>
            <button className="p-1.5 hover:bg-surface-container rounded-lg transition-colors relative">
              <Bell className="w-4 h-4 text-on-surface-variant" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto custom-scrollbar">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id);
                    if (window.innerWidth < 1024) onToggle();
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left relative group",
                    isActive
                      ? "bg-primary text-white shadow-md"
                      : "hover:bg-surface-container text-on-surface"
                  )}
                >
                  <Icon className={cn(
                    "w-5 h-5 transition-transform group-hover:scale-110",
                    isActive ? "text-white" : "text-primary"
                  )} />
                  <span className="text-sm font-medium flex-1">{item.label}</span>
                  {item.badge && (
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold",
                      isActive 
                        ? "bg-white/20 text-white" 
                        : "bg-primary/10 text-primary"
                    )}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-outline-variant">
          <div className="bg-gradient-to-br from-secondary/10 to-primary/10 rounded-xl p-4">
            <p className="text-xs font-bold text-primary mb-1">
              🌱 84% Fresh Local Produce
            </p>
            <p className="text-[10px] text-on-surface-variant leading-relaxed">
              You're supporting local farms and reducing your carbon footprint
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Toggle Button */}
      <button
        onClick={onToggle}
        className={cn(
          "fixed top-4 left-4 z-30 lg:hidden p-3 bg-white rounded-xl shadow-lg border border-outline-variant transition-all",
          isOpen && "opacity-0 pointer-events-none"
        )}
      >
        <Menu className="w-5 h-5 text-primary" />
      </button>
    </>
  );
}
