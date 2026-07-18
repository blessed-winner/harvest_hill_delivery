import { ReactNode, useState, useEffect } from 'react';
import TopBar from './components/TopBar';
import Footer from './components/Footer';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  CreditCard, 
  Truck, 
  History, 
  Receipt,
  X
} from 'lucide-react';

interface ClientLayoutProps {
  children: ReactNode;
  activeScreen: string;
  onNavigate: (screen: string, category?: string) => void;
  cartCount: number;
}

export default function ClientLayout({ children, activeScreen, onNavigate, cartCount }: ClientLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Start open by default
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsLoggedIn(!!localStorage.getItem('access_token'));
    }
  }, [activeScreen]);

  const screens = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'catalog', label: 'Catalog', icon: Package },
    { id: 'cart', label: 'Cart', icon: ShoppingCart },
    { id: 'checkout', label: 'Checkout', icon: CreditCard },
    { id: 'delivery-note', label: 'Delivery Note', icon: Truck },
    { id: 'order-history', label: 'History', icon: History },
    { id: 'invoices', label: 'Invoices', icon: Receipt }
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const showSidebar = isLoggedIn && activeScreen !== 'landing';

  return (
    <div className="bg-[#fcf9f2] min-h-screen flex flex-col font-sans selection:bg-[#9ed0ab] selection:text-[#144227]">
      {/* Header Navigation */}
      <TopBar 
        activeScreen={activeScreen} 
        onNavigate={onNavigate} 
        cartCount={cartCount} 
        onMenuClick={showSidebar ? toggleSidebar : undefined} 
      />

      {/* Sidebar Backdrop for Mobile */}
      {showSidebar && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[998] lg:hidden transition-all duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex-grow flex relative">
        {/* Floating Sidebar */}
        {showSidebar && (
          <aside className={`
            fixed lg:sticky top-24 bottom-4 lg:bottom-auto left-6 h-[calc(100vh-120px)] lg:h-[calc(100vh-120px)] w-64 
            bg-[#144227]/95 backdrop-blur-md rounded-2xl border border-[#9ed0ab]/30 shadow-2xl p-6 z-[999] 
            flex flex-col justify-between transition-all duration-300 ease-in-out shrink-0
            lg:translate-x-0 lg:opacity-100
            ${isSidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-[110%] opacity-0 lg:translate-x-0 lg:opacity-100'}
          `}>
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-white font-extrabold text-lg tracking-tight">Client Portal</h2>
                  <p className="text-[10px] text-[#9ed0ab] font-bold uppercase tracking-widest mt-0.5">Navigation Menu</p>
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(false)} 
                  className="lg:hidden p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="space-y-1.5 overflow-y-none max-h-[calc(100vh-210px)] pr-1 custom-scrollbar">
                {screens.map((screen) => {
                  const isActive = activeScreen === screen.id;
                  const Icon = screen.icon;
                  return (
                    <button
                      key={screen.id}
                      onClick={() => {
                        onNavigate(screen.id);
                        // Don't auto-close sidebar on navigation
                      }}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer
                        ${isActive 
                          ? 'bg-[#9ed0ab] text-[#00210f] shadow-md scale-102' 
                          : 'text-white/80 hover:text-white hover:bg-white/10'}
                      `}
                    >
                      <Icon size={16} className={isActive ? 'text-[#00210f]' : 'text-[#9ed0ab]'} />
                      <span>{screen.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-white/10 text-center">
              <p className="text-[10px] text-white/50">© 2024 Harvest Hill Supply</p>
            </div>
          </aside>
        )}

        {/* Main Content Area */}
        <main className={`flex-grow min-w-0 px-4 sm:px-6 lg:px-8 py-6 transition-all duration-300 ${showSidebar ? 'lg:pl-10' : ''}`}>
          {children}
        </main>
      </div>

      {/* Footer Navigation */}
      {activeScreen === 'landing' && (
        <Footer activeScreen={activeScreen} onNavigate={onNavigate} />
      )}
    </div>
  );
}

