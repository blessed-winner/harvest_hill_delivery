'use client';

import { useState } from 'react';
import ClientLayout from '../../portals/client/ClientLayout';
import Landing from '../../portals/client/pages/Landing';
import Dashboard from '../../portals/client/pages/Dashboard';
import Catalog from '../../portals/client/pages/Catalog';
import ProductDetail from '../../portals/client/pages/ProductDetail';
import Cart from '../../portals/client/pages/Cart';
import Checkout from '../../portals/client/pages/Checkout';
import DeliveryNote from '../../portals/client/pages/DeliveryNote';
import OrderHistory from '../../portals/client/pages/OrderHistory';
import Invoices from '../../portals/client/pages/Invoices';

export default function ClientPage() {
  const [activeScreen, setActiveScreen] = useState('landing'); // Default view is now the Marketplace Home
  const [cartCount, setCartCount] = useState(17); // Set to 17 items as in the Cart order summary screenshot

  const handleNavigate = (screen: string) => {
    setActiveScreen(screen);
    // Smooth scroll to top on page transition
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = () => {
    setCartCount((prev) => prev + 1);
  };

  const handleClearCart = () => {
    setCartCount(0);
  };

  const renderActiveScreen = () => {
    switch (activeScreen) {
      case 'landing':
        return <Landing onNavigate={handleNavigate} addToCart={handleAddToCart} />;
      case 'catalog':
        return <Catalog onNavigate={handleNavigate} addToCart={handleAddToCart} />;
      case 'product-detail':
        return <ProductDetail onNavigate={handleNavigate} addToCart={handleAddToCart} />;
      case 'cart':
        return <Cart onNavigate={handleNavigate} cartCount={cartCount} setCartCount={setCartCount} />;
      case 'checkout':
        return <Checkout onNavigate={handleNavigate} clearCart={handleClearCart} />;
      case 'delivery-note':
        return <DeliveryNote onNavigate={handleNavigate} />;
      case 'order-history':
        return <OrderHistory onNavigate={handleNavigate} />;
      case 'invoices':
        return <Invoices onNavigate={handleNavigate} />;
      case 'dashboard':
      default:
        return <Dashboard onNavigate={handleNavigate} addToCart={handleAddToCart} />;
    }
  };

  return (
    <ClientLayout
      activeScreen={activeScreen}
      onNavigate={handleNavigate}
      cartCount={cartCount}
    >
      {renderActiveScreen()}
    </ClientLayout>
  );
}
