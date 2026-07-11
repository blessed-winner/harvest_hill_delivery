import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Dashboard } from './components/Dashboard';
import { UserManagement } from './components/UserManagement';
import { OrdersManagement } from './components/OrdersManagement';
import { ProductCatalog } from './components/ProductCatalog';
import { DeliveryNotes } from './components/DeliveryNotes';
import { Invoices } from './components/Invoices';
import { Supplies } from './components/Supplies';
import { Reports } from './components/Reports';
import { ViewType } from './types';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'users': return <UserManagement />;
      case 'orders': return <OrdersManagement />;
      case 'products': return <ProductCatalog />;
      case 'deliveries': return <DeliveryNotes />;
      case 'invoices': return <Invoices />;
      case 'supplies': return <Supplies />;
      case 'reports': return <Reports />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      
      <div className="flex-1 flex flex-col min-w-0 relative">
        <TopBar />
        
        <main className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="h-full overflow-y-auto scrollbar-hide"
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
