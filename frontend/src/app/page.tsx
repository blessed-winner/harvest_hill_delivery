"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ClientLayout from '../portals/client/ClientLayout';
import Landing from '../components/Landing';
import Catalog from '../portals/client/pages/Catalog';
import ProductDetail from '../portals/client/pages/ProductDetail';
import FAQ from '../components/FAQ';
import Cart from '../portals/client/pages/Cart';
import { CurrencyProvider } from '../context/CurrencyContext';

export default function HomePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      const role = localStorage.getItem('user_role');
      setIsLoggedIn(!!token);
      setUserRole(role);

      if (token && role === 'admin') {
        router.replace('/admin');
        return;
      }
      if (token && role === 'farmer') {
        router.replace('/farmer');
        return;
      }
    }
  }, [router]);

  const [activeScreen, setActiveScreen] = useState('landing');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlScreen = params.get('screen');
      const urlCat = params.get('category');
      const urlProd = params.get('productId');
      if (urlScreen) setActiveScreen(urlScreen);
      if (urlCat) setSelectedCategory(urlCat);
      if (urlProd) setSelectedProductId(Number(urlProd));

      const handlePop = () => {
        const p = new URLSearchParams(window.location.search);
        setActiveScreen(p.get('screen') || 'landing');
        if (p.get('category')) setSelectedCategory(p.get('category')!);
        if (p.get('productId')) setSelectedProductId(Number(p.get('productId')));
      };
      window.addEventListener('popstate', handlePop);
      return () => window.removeEventListener('popstate', handlePop);
    }
  }, []);

  const handleNavigate = (screen: string, category?: string, productId?: number, querySearch?: string) => {
    if (screen === 'checkout' && !isLoggedIn) {
      localStorage.setItem('pending_checkout_product_id', productId ? String(productId) : '');
      router.push('/login?redirect=checkout');
      return;
    }
    setActiveScreen(screen);
    if (category) setSelectedCategory(category);
    if (productId !== undefined) setSelectedProductId(productId);
    if (querySearch !== undefined) setSearchQuery(querySearch);

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams();
      if (screen !== 'landing') urlParams.set('screen', screen);
      if (category && category !== 'all') urlParams.set('category', category);
      if (productId !== undefined && productId !== null) urlParams.set('productId', String(productId));
      if (querySearch) urlParams.set('search', querySearch);
      const queryString = urlParams.toString();
      const newUrl = queryString ? `/?${queryString}` : '/';
      window.history.pushState({ screen, category, productId, search: querySearch }, '', newUrl);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = (product?: any) => {
    if (product) {
      try {
        const cartKey = 'guest_cart';
        const savedCart = localStorage.getItem(cartKey);
        const cartItems = savedCart ? JSON.parse(savedCart) : [];
        const existingIndex = cartItems.findIndex((item: any) => item.id === product.id);
        if (existingIndex >= 0) {
          cartItems[existingIndex].qty += 1;
        } else {
          cartItems.push({
            id: product.id,
            product_id: product.product_id || product.id,
            name: product.name,
            category: product.category,
            price: product.price,
            unit: product.unit,
            qty: 1,
            image_url: product.image_url || product.image
          });
        }
        localStorage.setItem(cartKey, JSON.stringify(cartItems));
        setCartCount(cartItems.length);
      } catch {}

      if (!isLoggedIn) {
        router.push('/login?redirect=cart');
        return;
      }
    } else {
      setCartCount((prev) => prev + 1);
      if (!isLoggedIn) {
        router.push('/login?redirect=cart');
      }
    }
  };

  const renderActiveScreen = () => {
    switch (activeScreen) {
      case 'cart':
        return <Cart onNavigate={handleNavigate} cartCount={cartCount} setCartCount={setCartCount} />;
      case 'catalog':
        return <Catalog onNavigate={handleNavigate} addToCart={handleAddToCart} initialCategory={selectedCategory} initialSearch={searchQuery} />;
      case 'product-detail':
        return <ProductDetail onNavigate={handleNavigate} addToCart={handleAddToCart} productId={selectedProductId} />;
      case 'faq':
        return <FAQ onNavigate={handleNavigate} />;
      case 'landing':
      default:
        return <Landing onNavigate={handleNavigate} addToCart={handleAddToCart} />;
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


