"use client";

import Link from 'next/link';
import { Users, Tractor, Building2 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-container flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-primary font-bold text-2xl">HH</span>
            </div>
            <h1 className="text-4xl font-bold text-white">Harvest Hill</h1>
          </div>
          <p className="text-on-primary-container text-lg">
            Bridging the gap between artisanal local farms and high-end culinary professionals
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/client"
            className="group bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1"
          >
            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary group-hover:scale-110 transition-all">
              <Users className="w-7 h-7 text-primary group-hover:text-white" />
            </div>
            <h2 className="text-xl font-bold text-primary mb-2">Client Portal</h2>
            <p className="text-sm text-on-surface-variant">
              Browse products, place orders, and manage your culinary supply chain
            </p>
          </Link>

          <Link
            href="/farmer"
            className="group bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1"
          >
            <div className="w-14 h-14 bg-secondary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-secondary group-hover:scale-110 transition-all">
              <Tractor className="w-7 h-7 text-secondary group-hover:text-white" />
            </div>
            <h2 className="text-xl font-bold text-secondary mb-2">Farmer Portal</h2>
            <p className="text-sm text-on-surface-variant">
              Submit harvests, manage supplies, and negotiate prices
            </p>
          </Link>

          <Link
            href="/admin"
            className="group bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1"
          >
            <div className="w-14 h-14 bg-tertiary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-tertiary group-hover:scale-110 transition-all">
              <Building2 className="w-7 h-7 text-tertiary group-hover:text-white" />
            </div>
            <h2 className="text-xl font-bold text-tertiary mb-2">Admin Portal</h2>
            <p className="text-sm text-on-surface-variant">
              Manage operations, users, orders, and supply negotiations
            </p>
          </Link>
        </div>

        <div className="mt-12 text-center">
          <p className="text-white/80 text-sm">
            Select a portal to continue
          </p>
        </div>
      </div>
    </div>
  );
}

