'use client';

import { useState } from 'react';
import ClientLayout from '../../portals/client/ClientLayout';
import Dashboard from '../../portals/client/pages/Dashboard';
import Catalog from '../../portals/client/pages/Catalog';
import Checkout from '../../portals/client/pages/Checkout';
import DeliveryNote from '../../portals/client/pages/DeliveryNote';
import ProductDetail from '../../portals/client/pages/ProductDetail';

export default function ClientPage() {
  const [activeScreen, setActiveScreen] = useState('dashboard');
  const [cartCount, setCartCount] = useState(2); // Starts with 2 items as in original dashboard screenshot

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
      case 'catalog':
        return <Catalog onNavigate={handleNavigate} addToCart={handleAddToCart} />;
      case 'checkout':
        return <Checkout onNavigate={handleNavigate} clearCart={handleClearCart} />;
      case 'delivery-note':
        return <DeliveryNote onNavigate={handleNavigate} />;
      case 'product-detail':
        return <ProductDetail onNavigate={handleNavigate} addToCart={handleAddToCart} />;
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
