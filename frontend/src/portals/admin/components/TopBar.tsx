import React from 'react';
import { Search, Bell, Settings } from 'lucide-react';

export function TopBar() {
  return (
    <header className="h-14 flex items-center justify-between px-6 bg-white border-b border-outline-variant shrink-0 z-20">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant transition-colors group-focus-within:text-primary" />
          <input 
            type="text" 
            placeholder="Search record, SKUs, or orders..."
            className="w-full h-9 pl-10 pr-4 bg-surface-container-low border-none rounded-full text-sm focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/60"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-all relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>
        <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-all">
          <Settings className="w-5 h-5" />
        </button>
        
        <div className="h-6 w-px bg-outline-variant mx-2" />
        
        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold leading-none">Silas Thorne</p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-tighter mt-1">Logistics Lead</p>
          </div>
          <img 
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" 
            alt="Admin"
            className="w-8 h-8 rounded-full border border-outline-variant object-cover shadow-sm cursor-pointer"
          />
        </div>
      </div>
    </header>
  );
}
