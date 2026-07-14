"use client";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Bell, Menu } from 'lucide-react';
import { api } from '../lib/api';

interface TopBarProps {
  activeView?: string;
  onMenuToggle: () => void;
}

export default function TopBar({ activeView, onMenuToggle }: TopBarProps) {
  const [farmName, setFarmName] = useState('Green Valley Farm');
  const [roleLabel, setRoleLabel] = useState('Tier 1 Supplier');
  const profileImage =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuC9re6yJPQ5TYt9TGg1Mt0-bI4EtsJFQjADaJ-AwucfipGIVS_n3JHlVfqhYm5ByV0h5A3ex6xXqVx_l3oBhemoxWVhA0IPAGluGjQO4OPoJ9gQdqnssN5XJBPp5OFVC7xQElJLs4enHGBVPXJAWBIS1VNjcQowBBzGU4M_b4cPWpbY3sw7Bu_wCsn5_rNTUAiuiqPMd8LwtDezfTQ-Zehk2fUY53IVBnoVJaGfWMQAjI0XQr03PQqA9Q';

  const viewTitles: Record<string, string> = {
    dashboard: 'Dashboard Overview',
    submit: 'Submit New Harvest',
    supplies: 'My Supplies',
    negotiations: 'Negotiations & Deals',
    invoices: 'Invoices & Payments',
    settings: 'Farmer Profile & Settings',
  };

  const activeTitle = activeView ? viewTitles[activeView] || 'Farmer Portal' : 'Farmer Portal';

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        const profile = await api.farmerProfile();
        if (!mounted) return;

        setFarmName(profile.farm_name || profile.user?.username || 'Green Valley Farm');
        setRoleLabel(profile.user?.role ? `${String(profile.user.role).toUpperCase()} Supplier` : 'Tier 1 Supplier');
      } catch (error) {
        console.error('Failed to load profile header:', error);
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-outline-variant shrink-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>
        <h2 className="font-sans text-base font-bold text-primary">{activeTitle}</h2>
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors relative group">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-surface"></span>
        </button>

        <div className="flex items-center gap-3 border-l border-outline-variant pl-3 sm:pl-5 cursor-pointer group">
          <div className="text-right hidden sm:block">
            <p className="font-mono text-xs font-bold text-on-surface">{farmName}</p>
            <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">{roleLabel}</p>
          </div>
          <img
            src={profileImage}
            alt="Farm profile"
            className="w-9 h-9 rounded-full border-2 border-primary object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </div>
    </header>
  );
}
