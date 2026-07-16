import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  ShoppingCart, 
  Bell,
  User,
  X
} from 'lucide-react';

interface SidebarProps {
  activeScreen: string;
  onNavigate: (screen: string) => void;
  cartCount: number;
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ activeScreen, onNavigate, cartCount, isOpen, onToggle }: SidebarProps) {
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'catalog', label: 'Browse Products', icon: ShoppingBag },
    { id: 'order-history', label: 'My Orders', icon: Package },
    { id: 'cart', label: 'Shopping Cart', icon: ShoppingCart, badge: cartCount }
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[998] lg:hidden transition-all duration-300"
          onClick={onToggle}
        />
      )}

      {/* Floating Sidebar */}
      <aside className={`
        fixed top-24 bottom-6 left-6 w-72 
        bg-white/90 backdrop-blur-xl rounded-2xl 
        border border-gray-200/50 shadow-2xl 
        z-[999] flex flex-col 
        transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-[110%] lg:translate-x-0 lg:opacity-100'}
      `}>
        {/* User Profile Section */}
        <div className="p-6 border-b border-gray-200/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#144227] to-[#9ed0ab] flex items-center justify-center">
                <User size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-[#144227] text-sm">Welcome Back</h3>
                <p className="text-xs text-gray-600">Client Portal</p>
              </div>
            </div>
            <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors">
              <Bell size={18} className="text-[#144227]" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button 
              onClick={onToggle} 
              className="lg:hidden p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={18} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 overflow-y-auto custom-scrollbar">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const isActive = activeScreen === item.id;
              const Icon = item.icon;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    if (window.innerWidth < 1024) {
                      onToggle();
                    }
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl 
                    text-sm font-semibold transition-all 
                    ${isActive 
                      ? 'bg-[#144227] text-white shadow-md' 
                      : 'text-gray-700 hover:bg-gray-100'}
                  `}
                >
                  <Icon size={20} className={isActive ? 'text-[#9ed0ab]' : 'text-[#144227]'} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`
                      px-2 py-0.5 rounded-full text-xs font-bold
                      ${isActive ? 'bg-[#9ed0ab] text-[#144227]' : 'bg-[#144227] text-white'}
                    `}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200/50">
          <div className="text-center">
            <p className="text-xs text-gray-500 font-medium">
              🌱 Supporting Local & Sustainable Agriculture
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
