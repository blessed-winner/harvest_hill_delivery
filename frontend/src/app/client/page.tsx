'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ClientLayout from '../../portals/client/ClientLayout';
import Landing from '../../components/Landing';
import Dashboard from '../../portals/client/pages/Dashboard';
import Catalog from '../../portals/client/pages/Catalog';
import ProductDetail from '../../portals/client/pages/ProductDetail';
import Cart from '../../portals/client/pages/Cart';
import Checkout from '../../portals/client/pages/Checkout';
import DeliveryNote from '../../portals/client/pages/DeliveryNote';
import OrderHistory from '../../portals/client/pages/OrderHistory';
import Invoices from '../../portals/client/pages/Invoices';
import { CurrencyProvider } from '../../context/CurrencyContext';
import { getCartStorageKey } from '../../portals/client/lib/api';

export default function ClientPage() {
  const router = useRouter();
  const [activeScreen, setActiveScreen] = useState('landing'); // Default view is now the Marketplace Home
  const [selectedCategory, setSelectedCategory] = useState<string>('all'); // Track selected category
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null); // Track selected product
  const [cartCount, setCartCount] = useState(0);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      const role = localStorage.getItem('user_role');
      if (!token || role !== 'client') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_role');
        router.push('/');
      } else {
        setAuthorized(true);
        const urlParams = new URLSearchParams(window.location.search);
        const urlScreen = urlParams.get('screen');
        const urlProductId = urlParams.get('productId');
        const storedScreen = localStorage.getItem('client_active_screen');
        const initialScreen = urlScreen || storedScreen || 'dashboard';
        setActiveScreen(initialScreen);
        if (urlProductId) {
          setSelectedProductId(Number(urlProductId));
        }

        // Load cart count from user-scoped localStorage
        try {
          const cartKey = getCartStorageKey();
          const savedCart = localStorage.getItem(cartKey);
          if (savedCart) {
            const items = JSON.parse(savedCart);
            setCartCount(items.length);
          }
        } catch {}
      }
    }
  }, [router]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const urlParams = new URLSearchParams(window.location.search);
      const urlScreen = urlParams.get('screen') || event.state?.screen || 'landing';
      setActiveScreen(urlScreen);
      localStorage.setItem('client_active_screen', urlScreen);
      if (event.state?.category) setSelectedCategory(event.state.category);
      if (event.state?.productId) setSelectedProductId(event.state.productId);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcf9f2]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#144227] border-t-transparent"></div>
      </div>
    );
  }

  const handleNavigate = (screen: string, category?: string, productId?: number) => {
    setActiveScreen(screen);
    localStorage.setItem('client_active_screen', screen);
    if (typeof window !== 'undefined') {
      window.history.pushState({ screen, category, productId }, '', `/client?screen=${screen}`);
    }
    if (category) {
      setSelectedCategory(category);
    } else if (screen === 'catalog') {
      setSelectedCategory('all');
    }
    if (productId !== undefined) {
      setSelectedProductId(productId);
    }
    // Smooth scroll to top on page transition
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = (product?: any) => {
    if (product) {
      // Add product to user-scoped localStorage cart
      try {
        const cartKey = getCartStorageKey();
        const savedCart = localStorage.getItem(cartKey);
        const cartItems = savedCart ? JSON.parse(savedCart) : [];
        
        // Check if product already exists in cart (use supply ID for uniqueness)
        const existingIndex = cartItems.findIndex((item: any) => item.id === product.id);
        
        if (existingIndex >= 0) {
          // Increment quantity
          cartItems[existingIndex].qty += 1;
        } else {
          // Add new product
          cartItems.push({
            id: product.id, // Supply ID for cart identification
            product_id: product.product_id || product.id, // Actual product ID for orders
            name: product.name,
            category: product.category,
            price: product.price,
            unit: product.unit,
            qty: 1,
            image_url: product.image_url || product.image
          });
        }
        
        localStorage.setItem(cartKey, JSON.stringify(cartItems));
        
        // Update cart count with distinct line items count
        setCartCount(cartItems.length);
      } catch (err) {
        console.error('Failed to add to cart:', err);
      }
    } else {
      // Legacy: just increment counter
      setCartCount((prev) => prev + 1);
    }
  };

  const handleClearCart = () => {
    setCartCount(0);
  };

  const renderActiveScreen = () => {
    switch (activeScreen) {
      case 'landing':
        return <Landing onNavigate={handleNavigate} addToCart={handleAddToCart} />;
      case 'catalog':
        return <Catalog onNavigate={handleNavigate} addToCart={handleAddToCart} initialCategory={selectedCategory} />;
      case 'product-detail':
        return <ProductDetail onNavigate={handleNavigate} addToCart={handleAddToCart} productId={selectedProductId} />;
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
    <CurrencyProvider>
    <ClientLayout
      activeScreen={activeScreen}
      onNavigate={handleNavigate}
      cartCount={cartCount}
    >
      {renderActiveScreen()}
    </ClientLayout>
    </CurrencyProvider>
  );
}
