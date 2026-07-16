"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ClientLayout from '../portals/client/ClientLayout';
import Landing from '../portals/client/pages/Landing';
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
    }
  }, []);

  const handleNavigate = (screen: string) => {
    if (isLoggedIn) {
      if (userRole === 'client') {
        localStorage.setItem('client_active_screen', screen);
        router.push('/client');
      } else {
        router.push(`/${userRole}`);
      }
    } else {
      router.push('/login');
    }
  };

  const handleAddToCart = () => {
    if (isLoggedIn) {
      setCartCount((prev) => prev + 1);
    } else {
      router.push('/login');
    }
  };

  return (
    <CurrencyProvider>
      <ClientLayout
        activeScreen="landing"
        onNavigate={handleNavigate}
        cartCount={cartCount}
      >
        <Landing onNavigate={handleNavigate} addToCart={handleAddToCart} />
      </ClientLayout>
    </CurrencyProvider>
  );
}


