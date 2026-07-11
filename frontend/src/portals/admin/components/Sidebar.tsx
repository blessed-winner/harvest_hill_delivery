import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingCart, 
  Truck, 
  Receipt, 
  Warehouse, 
  BarChart3, 
  UserCircle, 
  LogOut 
} from 'lucide-react';
import { ViewType } from '../types';
import { cn } from '../lib/utils';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'deliveries', label: 'Delivery Notes', icon: Truck },
  { id: 'invoices', label: 'Invoices', icon: Receipt },
  { id: 'supplies', label: 'Supplies', icon: Warehouse },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
] as const;

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  return (
    <aside className="w-[260px] bg-primary flex flex-col h-full py-4 shadow-sm z-30 shrink-0">
      <div className="px-6 mb-8">
        <h1 className="text-lg font-bold text-white leading-tight">Harvest Hill</h1>
        <p className="text-[10px] uppercase tracking-widest text-white/60 font-bold">Supply Chain Admin</p>
      </div>

      <nav className="flex-1 px-2 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id as ViewType)}
            className={cn(
              "w-full flex items-center px-4 py-2.5 rounded-lg transition-all group",
              currentView === item.id 
                ? "bg-primary-container text-on-primary-container font-semibold" 
                : "text-white/80 hover:text-white hover:bg-primary-container/20"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5 mr-3 transition-colors",
              currentView === item.id ? "text-on-primary-container" : "text-white/60 group-hover:text-white"
            )} />
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto px-4 pt-4 border-t border-white/10 space-y-1">
        <button className="w-full flex items-center px-4 py-2.5 text-white/80 hover:text-white hover:bg-primary-container/20 rounded-lg transition-colors">
          <UserCircle className="w-5 h-5 mr-3 text-white/60" />
          <span className="text-sm">Admin Profile</span>
        </button>
        <button className="w-full flex items-center px-4 py-2.5 text-white/80 hover:text-white hover:bg-primary-container/20 rounded-lg transition-colors">
          <LogOut className="w-5 h-5 mr-3 text-white/60" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
}
