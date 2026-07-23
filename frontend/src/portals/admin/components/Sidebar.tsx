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
  LogOut,
  X
} from 'lucide-react';
import { ViewType } from '../../types';
import { cn } from '../lib/utils';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isOpen?: boolean;
  onClose?: () => void;
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

export function Sidebar({ currentView, onViewChange, isOpen = false, onClose }: SidebarProps) {
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    window.location.href = '/login';
  };

  return (
    <aside className={cn(
      "w-[260px] bg-primary flex flex-col h-screen fixed left-0 top-0 bottom-0 py-4 shadow-sm z-50 shrink-0 overflow-hidden transition-transform duration-300",
      "lg:translate-x-0 lg:flex",
      isOpen 
        ? "translate-x-0" 
        : "-translate-x-full lg:translate-x-0"
    )}>
      <div className="px-6 mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white leading-tight">Harvest Hill</h1>
          <p className="text-[10px] uppercase tracking-widest text-white/60 font-bold">Supply Chain Admin</p>
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

      <nav className="flex-1 px-2 space-y-1 overflow-y-auto custom-scrollbar">
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

      <div className="mt-auto px-4 pt-4 border-t border-white/10 space-y-1 shrink-0">
        <button 
          onClick={() => onViewChange('settings')}
          className="w-full flex items-center px-4 py-2.5 text-white/80 hover:text-white hover:bg-primary-container/20 rounded-lg transition-colors"
        >
          <UserCircle className="w-5 h-5 mr-3 text-white/60" />
          <span className="text-sm">Admin Profile</span>
        </button>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center px-4 py-2.5 text-white/80 hover:text-white hover:bg-primary-container/20 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3 text-white/60" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
}
