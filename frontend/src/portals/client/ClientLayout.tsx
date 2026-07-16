import { ReactNode, useState, useEffect } from 'react';
import TopBar from './components/TopBar';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';

interface ClientLayoutProps {
  children: ReactNode;
  activeScreen: string;
  onNavigate: (screen: string) => void;
  cartCount: number;
}

export default function ClientLayout({ children, activeScreen, onNavigate, cartCount }: ClientLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsLoggedIn(!!localStorage.getItem('access_token'));
    }
  }, [activeScreen]);

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

      <div className="flex-grow flex relative">
        {/* Floating Sidebar */}
        {showSidebar && (
          <Sidebar
            activeScreen={activeScreen}
            onNavigate={onNavigate}
            cartCount={cartCount}
            isOpen={isSidebarOpen}
            onToggle={toggleSidebar}
          />
        )}

        {/* Main Content Area */}
        <main className={`flex-grow min-w-0 px-4 sm:px-6 lg:px-8 py-6 transition-all duration-300 ${showSidebar ? 'lg:ml-80' : ''}`}>
          {children}
        </main>
      </div>

      {/* Footer Navigation */}
      <Footer activeScreen={activeScreen} onNavigate={onNavigate} />
    </div>
  );
}

