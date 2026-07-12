"use client";

import { ReactNode } from 'react';
import TopBar from './components/TopBar';
import Footer from './components/Footer';

interface ClientLayoutProps {
  children: ReactNode;
  activeScreen: string;
  onNavigate: (screen: string) => void;
  cartCount: number;
}

export default function ClientLayout({ children, activeScreen, onNavigate, cartCount }: ClientLayoutProps) {
  const screens = [
    { id: 'dashboard', label: '1. Dashboard' },
    { id: 'catalog', label: '2. Catalog' },
    { id: 'checkout', label: '3. Checkout' },
    { id: 'delivery-note', label: '4. Delivery Note' },
    { id: 'product-detail', label: '5. Product Detail' }
  ];

  return (
    <div className="bg-[#fcf9f2] min-h-screen flex flex-col font-sans selection:bg-[#9ed0ab] selection:text-[#144227]">
      {/* Header Navigation */}
      <TopBar activeScreen={activeScreen} onNavigate={onNavigate} cartCount={cartCount} />

      {/* Main Content Area */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer Navigation */}
      <Footer activeScreen={activeScreen} />

      {/* Floating Screen Preview Switcher */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#144227]/95 backdrop-blur-md px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border border-[#9ed0ab]/30 z-[9999] transition-all hover:scale-102">
        <span className="text-[10px] uppercase font-bold tracking-wider text-[#9ed0ab] mr-2 border-r border-[#9ed0ab]/30 pr-3 hidden sm:inline">
          Preview Screen
        </span>
        <div className="flex items-center gap-1.5">
          {screens.map((screen) => {
            const isActive = activeScreen === screen.id;
            return (
              <button
                key={screen.id}
                onClick={() => onNavigate(screen.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#9ed0ab] text-[#00210f] shadow-md scale-105'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {screen.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
