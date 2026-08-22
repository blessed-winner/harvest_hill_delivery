"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FarmerLayout from '../../portals/farmer/FarmerLayout';
import Dashboard from '../../portals/farmer/pages/Dashboard';
import SubmitHarvest from '../../portals/farmer/pages/SubmitHarvest';
import MySupplies from '../../portals/farmer/pages/MySupplies';
import Negotiations from '../../portals/farmer/pages/Negotiations';
import Invoices from '../../portals/farmer/pages/Invoices';
import Settings from '../../portals/farmer/pages/Settings';
import { View } from '../../portals/types';
import { api } from '../../portals/farmer/lib/api';

export default function FarmerPage() {
  const router = useRouter();
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [authorized, setAuthorized] = useState(false);

  const [preselectedProduct, setPreselectedProduct] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      const role = localStorage.getItem('user_role');
      if (!token || role !== 'farmer') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_role');
        router.replace('/');
        return;
      }

      // Verify active session before rendering FarmerLayout to prevent UI flash on 401
      api.me()
        .then(() => {
          setAuthorized(true);
          const urlParams = new URLSearchParams(window.location.search);
          const urlView = urlParams.get('view') as View;
          if (urlView) {
            setActiveView(urlView);
          }
        })
        .catch(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_role');
          router.replace('/');
        });
    }
  }, [router]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const urlParams = new URLSearchParams(window.location.search);
      const urlView = (urlParams.get('view') || event.state?.view || 'dashboard') as View;
      setActiveView(urlView);
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

  const handleViewChange = (view: View, extraData?: any) => {
    setActiveView(view);
    if (extraData) {
      setPreselectedProduct(extraData);
    } else {
      setPreselectedProduct(null);
    }
    if (typeof window !== 'undefined') {
      window.history.pushState({ view }, '', `/farmer?view=${view}`);
    }
  };

  const renderView = () => {
    switch (activeView) {
      case 'submit':
        return <SubmitHarvest preselectedProduct={preselectedProduct} clearPreselected={() => setPreselectedProduct(null)} />;
      case 'supplies':
        return <MySupplies onViewChange={handleViewChange} />;
      case 'negotiations':
        return <Negotiations />;
      case 'invoices':
        return <Invoices />;
      case 'settings':
        return <Settings />;
      case 'dashboard':
      default:
        return <Dashboard onViewChange={handleViewChange} />;
    }
  };

  return (
    <FarmerLayout activeView={activeView} onViewChange={handleViewChange}>
      {renderView()}
    </FarmerLayout>
  );
}
