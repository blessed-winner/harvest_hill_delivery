import { useEffect, useState } from 'react';
import { Search, User, History, Bell, ShoppingCart, Menu } from 'lucide-react';
import Link from 'next/link';

interface TopBarProps {
  activeScreen: string;
  onNavigate: (screen: string) => void;
  cartCount: number;
  onMenuClick?: () => void;
}

export default function TopBar({ activeScreen, onNavigate, cartCount, onMenuClick }: TopBarProps) {
  const isCatalog = activeScreen === 'catalog';
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsLoggedIn(!!localStorage.getItem('access_token'));
    }
  }, []);

  return (
    <header className="bg-white border-b border-[#e5e2db] py-4 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Brand Logo & Menu Toggle */}
        <div className="flex items-center gap-2 justify-between w-full md:w-auto">
          <div className="flex items-center gap-2">
            {onMenuClick && (
              <button
                onClick={onMenuClick}
                className="lg:hidden p-2 hover:bg-[#f0eee7] rounded-lg transition-colors cursor-pointer"
                title="Toggle Menu"
              >
                <Menu className="h-5 w-5 text-[#414942]" />
              </button>
            )}
            <button
              onClick={() => onNavigate('landing')}
              className="text-2xl font-bold text-[#144227] tracking-tight font-sans hover:opacity-85 transition-opacity cursor-pointer"
            >
              Harvest Hill
            </button>
          </div>
        </div>

        {/* Category Nav Links */}
        <nav className="flex items-center gap-6 overflow-x-auto py-1 scrollbar-hide">
          {[
            { name: 'Fruits', action: () => onNavigate('catalog') },
            { name: 'Vegetables', action: () => onNavigate('catalog') },
            { name: 'Dairy', action: () => onNavigate('catalog') },
            { name: 'Grains', action: () => onNavigate('catalog') },
            { name: 'Herbs', action: () => onNavigate('catalog') },
            { name: 'Seasonal', action: () => onNavigate('catalog') },
          ].map((item) => (
            <button
              key={item.name}
              onClick={item.action}
              className="text-[#414942] hover:text-[#144227] hover:underline underline-offset-4 text-sm font-medium transition-all whitespace-nowrap cursor-pointer"
            >
              {item.name}
            </button>
          ))}
        </nav>

        {/* Right Action Bar */}
        <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative w-full max-w-[280px]">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-[#717971]" />
            </span>
            <input
              type="text"
              placeholder={isCatalog ? "Search catalog..." : "Search harvest..."}
              className="w-full pl-9 pr-4 py-2 border border-[#c1c9c0] rounded-full bg-[#f6f3ec]/40 text-sm placeholder-[#717971] focus:outline-none focus:border-[#144227] focus:ring-1 focus:ring-[#144227] transition-all"
            />
          </div>

          {/* Action Icons / Login options */}
          <div className="flex items-center gap-3 sm:gap-4 text-[#414942]">
            {isLoggedIn ? (
              <>
                {/* Profile */}
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="p-2 hover:bg-[#f0eee7] rounded-full transition-colors cursor-pointer"
                  title="Profile Settings"
                >
                  <User className="h-5 w-5" />
                </button>

                {/* Delivery Note / History */}
                <button
                  onClick={() => onNavigate('order-history')}
                  className="p-2 hover:bg-[#f0eee7] rounded-full transition-colors cursor-pointer"
                  title="Order History"
                >
                  <History className="h-5 w-5" />
                </button>

                {/* Notifications */}
                <button
                  className="p-2 hover:bg-[#f0eee7] rounded-full transition-colors relative cursor-pointer"
                  title="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#ba1a1a] rounded-full border-2 border-white"></span>
                </button>

                {/* Shopping Cart */}
                <button
                  onClick={() => onNavigate('cart')}
                  className="p-2 hover:bg-[#f0eee7] rounded-full transition-colors relative cursor-pointer"
                  title="Harvest Cart"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 bg-[#144227] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {cartCount}
                  </span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-[#144227] font-semibold text-xs hover:underline cursor-pointer"
                >
                  Sign In
                </Link>
                <Link
                  href="/login"
                  className="bg-[#144227] text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-[#376847] transition-colors cursor-pointer"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
