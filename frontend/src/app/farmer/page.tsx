"use client";

import { useState } from 'react';
import FarmerLayout from '../../portals/farmer/FarmerLayout';
import Dashboard from '../../portals/farmer/pages/Dashboard';
import SubmitHarvest from '../../portals/farmer/pages/SubmitHarvest';
import MySupplies from '../../portals/farmer/pages/MySupplies';
import Negotiations from '../../portals/farmer/pages/Negotiations';
import Invoices from '../../portals/farmer/pages/Invoices';
import Settings from '../../portals/farmer/pages/Settings';
import { View } from '../../portals/types';

export default function FarmerPage() {
  const [activeView, setActiveView] = useState<View>('dashboard');

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
