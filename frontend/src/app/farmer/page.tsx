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

export default function FarmerPage() {
  const router = useRouter();
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      const role = localStorage.getItem('user_role');
      if (!token || role !== 'farmer') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_role');
        router.push('/login');
      } else {
        setAuthorized(true);
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

  const renderView = () => {
    switch (activeView) {
      case 'submit':
        return <SubmitHarvest />;
      case 'supplies':
        return <MySupplies />;
      case 'negotiations':
        return <Negotiations />;
      case 'invoices':
        return <Invoices />;
      case 'settings':
        return <Settings />;
      case 'dashboard':
      default:
        return <Dashboard onViewChange={setActiveView} />;
    }
  };

  return (
    <FarmerLayout activeView={activeView} onViewChange={setActiveView}>
      {renderView()}
    </FarmerLayout>
  );
}
