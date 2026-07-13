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
    { id: 'landing', label: '1. Landing' },
    { id: 'dashboard', label: '2. Dashboard' },
    { id: 'catalog', label: '3. Catalog' },
    { id: 'product-detail', label: '4. Detail' },
    { id: 'cart', label: '5. Cart' },
    { id: 'checkout', label: '6. Checkout' },
    { id: 'delivery-note', label: '7. Delivery Note' },
    { id: 'order-history', label: '8. History' },
    { id: 'invoices', label: '9. Invoices' }
  ];

  return (
    <div className="bg-[#fcf9f2] min-h-screen flex flex-col font-sans selection:bg-[#9ed0ab] selection:text-[#144227]">
      {/* Header Navigation */}
      <TopBar activeScreen={activeScreen} onNavigate={onNavigate} cartCount={cartCount} />

      {/* Main Content Area */}
      <main className="flex-grow pb-24">
        {children}
      </main>

      {/* Footer Navigation */}
      <Footer activeScreen={activeScreen} onNavigate={onNavigate} />

      {/* Floating Screen Preview Switcher */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-[#144227]/95 backdrop-blur-md px-8 py-4 rounded-2xl shadow-2xl flex flex-col md:flex-row items-center gap-3 border border-[#9ed0ab]/30 z-[9999] w-max max-w-[95vw] transition-all hover:scale-[1.01]">
        <div className="flex flex-wrap justify-center items-center gap-2 max-h-[140px] px-2 md:max-h-none overflow-y-auto w-full md:w-auto">
          {screens.map((screen) => {
            const isActive = activeScreen === screen.id;
            return (
              <button
                key={screen.id}
                onClick={() => onNavigate(screen.id)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold tracking-tight transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#9ed0ab] text-[#00210f] shadow-md scale-103'
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
