"use client";

import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Dashboard } from './pages/Dashboard';
import { UserManagement } from './pages/UserManagement';
import { ProductCatalog } from './pages/ProductCatalog';
import { OrdersManagement } from './pages/OrdersManagement';
import { DeliveryNotes } from './pages/DeliveryNotes';
import { Invoices } from './pages/Invoices';
import { Supplies } from './pages/Supplies';
import { Reports } from './pages/Reports';
import { ViewType } from '../types';

function renderView(view: ViewType) {
  switch (view) {
    case 'users':
      return <UserManagement />;
    case 'products':
      return <ProductCatalog />;
    case 'orders':
      return <OrdersManagement />;
    case 'deliveries':
      return <DeliveryNotes />;
    case 'invoices':
      return <Invoices />;
    case 'supplies':
      return <Supplies />;
    case 'reports':
      return <Reports />;
    case 'dashboard':
    default:
      return <Dashboard />;
  }
}

export default function AdminLayout() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');

  return (
    <div className="min-h-screen flex bg-surface">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar />
        <main className="flex-1 min-w-0 overflow-x-hidden">
          {renderView(currentView)}
        </main>
      </div>
    </div>
  );
}
