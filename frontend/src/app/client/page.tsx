'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { CurrencyProvider } from '../../context/CurrencyContext';

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
        const storedScreen = localStorage.getItem('client_active_screen');
        if (storedScreen) {
          setActiveScreen(storedScreen);
        }
        // Load cart count from localStorage
        try {
          const savedCart = localStorage.getItem('cart_items');
          if (savedCart) {
            const items = JSON.parse(savedCart);
            const totalQty = items.reduce((sum: number, item: any) => sum + (item.qty || 1), 0);
            setCartCount(totalQty);
          }
        } catch {}
      }
    }
  }, [router]);

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcf9f2]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#144227] border-t-transparent"></div>
      </div>
    );
  }

  const handleNavigate = (screen: string, category?: string, productId?: number) => {
    setActiveScreen(screen);
    if (category) {
      setSelectedCategory(category);
    }
    if (productId !== undefined) {
      setSelectedProductId(productId);
    }
    // Smooth scroll to top on page transition
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = (product?: any) => {
    if (product) {
      // Add product to localStorage cart
      try {
        const savedCart = localStorage.getItem('cart_items');
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
        
        localStorage.setItem('cart_items', JSON.stringify(cartItems));
        
        // Update cart count
        const totalQty = cartItems.reduce((sum: number, item: any) => sum + item.qty, 0);
        setCartCount(totalQty);
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
