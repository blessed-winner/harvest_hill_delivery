"use client";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Bell, Menu } from 'lucide-react';
import { api } from '../lib/api';

interface TopBarProps {
  onMenuToggle: () => void;
}

export default function TopBar({ onMenuToggle }: TopBarProps) {
  const [farmName, setFarmName] = useState('Green Valley Farm');
  const [roleLabel, setRoleLabel] = useState('Tier 1 Supplier');

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
    <header className="h-[64px] w-full fixed top-0 z-40 bg-surface border-b border-outline-variant flex justify-between items-center px-4 sm:px-6 lg:pl-[240px] lg:pr-8">
      <div className="flex items-center gap-3">
        <h2 className="font-sans text-base font-bold text-primary">Harvest Hill Delivery</h2>
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors relative group">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-surface"></span>
        </button>

        <div className="flex items-center gap-3 border-l border-outline-variant pl-3 sm:pl-5 cursor-pointer group">
          <div className="text-right hidden sm:block">
            <p className="font-mono text-xs font-bold text-on-surface">{farmName}</p>
            <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">{roleLabel}</p>
          </div>
          <div className="w-9 h-9 rounded-full border-2 border-secondary-container overflow-hidden group-hover:scale-105 transition-transform duration-300 bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold font-mono">
            {farmName
              .split(' ')
              .slice(0, 2)
              .map((part) => part[0])
              .join('')
              .toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
