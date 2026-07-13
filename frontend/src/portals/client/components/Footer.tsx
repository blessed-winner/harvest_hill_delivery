"use client";

import { Clock, Leaf, Mail, ShieldAlert, Instagram } from 'lucide-react';

interface FooterProps {
  activeScreen: string;
  onNavigate: (screen: string) => void;
}

export default function Footer({ activeScreen, onNavigate }: FooterProps) {
  // Check which footer version to show
  if (activeScreen === 'catalog') {
    return (
      <footer className="bg-[#e9e6df] border-t border-[#dcdad3] py-12 text-[#414942] font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Logo & Info */}
          <div className="space-y-4">
            <h3
              onClick={() => onNavigate('landing')}
              className="text-2xl font-bold text-[#144227] cursor-pointer hover:opacity-80"
            >
              Harvest Hill
            </h3>
            <p className="text-sm leading-relaxed text-[#414942]/90 max-w-xs">
              Your premium gateway to the finest local agricultural supplies. Direct from the farm to your business.
            </p>
            <div className="flex items-center gap-3 text-[#144227]">
              <span className="p-2 bg-white rounded-full shadow-sm hover:scale-105 transition-transform"><Clock size={16} /></span>
              <span className="p-2 bg-white rounded-full shadow-sm hover:scale-105 transition-transform"><Leaf size={16} /></span>
              <span className="p-2 bg-white rounded-full shadow-sm hover:scale-105 transition-transform"><Mail size={16} /></span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="font-bold text-[#144227] text-xs uppercase tracking-wider mb-4">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => onNavigate('catalog')} className="hover:text-[#144227] transition-colors cursor-pointer text-left">Catalog</button></li>
              <li><button onClick={() => onNavigate('catalog')} className="hover:text-[#144227] transition-colors cursor-pointer text-left">Suppliers</button></li>
              <li><button onClick={() => onNavigate('catalog')} className="hover:text-[#144227] transition-colors cursor-pointer text-left">Sustainability</button></li>
              <li><button onClick={() => onNavigate('catalog')} className="hover:text-[#144227] transition-colors cursor-pointer text-left">Wholesale Pricing</button></li>
            </ul>
          </div>

          {/* Col 3: Support */}
          <div>
            <h4 className="font-bold text-[#144227] text-xs uppercase tracking-wider mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => onNavigate('dashboard')} className="hover:text-[#144227] transition-colors cursor-pointer text-left">Support Center</button></li>
              <li><button onClick={() => onNavigate('dashboard')} className="hover:text-[#144227] transition-colors cursor-pointer text-left">Quality Assurance</button></li>
              <li><button onClick={() => onNavigate('delivery-note')} className="hover:text-[#144227] transition-colors cursor-pointer text-left">Shipping Policy</button></li>
              <li><button onClick={() => onNavigate('invoices')} className="hover:text-[#144227] transition-colors cursor-pointer text-left">Privacy Policy</button></li>
            </ul>
          </div>

          {/* Col 4: Newsletter */}
          <div className="space-y-4">
            <h4 className="font-bold text-[#144227] text-xs uppercase tracking-wider mb-1">Newsletter</h4>
            <p className="text-sm">
              Get fresh harvest updates directly to your inbox.
            </p>
            <div className="flex">
              <input
                type="email"
                placeholder="Email address"
                className="px-3 py-2 text-sm bg-white border border-[#c1c9c0] rounded-l-md w-full focus:outline-none focus:border-[#144227]"
              />
              <button className="bg-[#144227] text-white px-4 text-sm font-semibold rounded-r-md hover:bg-[#376847] transition-colors cursor-pointer">
                Join
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-[#dcdad3] mt-10 pt-6 text-center text-xs">
          © 2024 Harvest Hill Supply Chain. All rights reserved.
        </div>
      </footer>
    );
  }

  if (activeScreen === 'product-detail') {
    return (
      <footer className="bg-[#e9e6df] border-t border-[#dcdad3] py-12 text-[#414942] font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Logo & Info */}
          <div className="space-y-4">
            <h3
              onClick={() => onNavigate('landing')}
              className="text-2xl font-bold text-[#144227] cursor-pointer hover:opacity-80"
            >
              Harvest Hill
            </h3>
            <p className="text-sm leading-relaxed text-[#414942]/90 max-w-xs">
              Connecting local farms directly to your business with transparency and quality assurance.
            </p>
            <div className="flex items-center gap-3 text-[#144227]">
              <span className="p-2 bg-white rounded-full shadow-sm hover:scale-105 transition-transform"><Clock size={16} /></span>
              <span className="p-2 bg-white rounded-full shadow-sm hover:scale-105 transition-transform"><Instagram size={16} /></span>
            </div>
          </div>

          {/* Col 2: Supply Chain */}
          <div>
            <h4 className="font-bold text-[#144227] text-xs uppercase tracking-wider mb-4">Supply Chain</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => onNavigate('dashboard')} className="hover:text-[#144227] transition-colors cursor-pointer text-left">Quality Assurance</button></li>
              <li><button onClick={() => onNavigate('delivery-note')} className="hover:text-[#144227] transition-colors cursor-pointer text-left">Shipping Policy</button></li>
              <li><button onClick={() => onNavigate('catalog')} className="hover:text-[#144227] transition-colors cursor-pointer text-left">Wholesale Portal</button></li>
            </ul>
          </div>

          {/* Col 3: Support */}
          <div>
            <h4 className="font-bold text-[#144227] text-xs uppercase tracking-wider mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => onNavigate('dashboard')} className="hover:text-[#144227] transition-colors cursor-pointer text-left">Support Center</button></li>
              <li><button onClick={() => onNavigate('invoices')} className="hover:text-[#144227] transition-colors cursor-pointer text-left">Privacy Policy</button></li>
              <li><button onClick={() => onNavigate('dashboard')} className="hover:text-[#144227] transition-colors cursor-pointer text-left">Terms of Service</button></li>
            </ul>
          </div>

          {/* Col 4: Stay Fresh */}
          <div className="space-y-4">
            <h4 className="font-bold text-[#144227] text-xs uppercase tracking-wider mb-1">Stay Fresh</h4>
            <p className="text-sm">
              Newsletter Signup
            </p>
            <div className="flex flex-col gap-2">
              <input
                type="email"
                placeholder="Your farm email"
                className="px-3 py-2 text-sm bg-white border border-[#c1c9c0] rounded-md focus:outline-none focus:border-[#144227]"
              />
              <button className="bg-[#144227] text-white py-2 text-sm font-semibold rounded-md hover:bg-[#376847] transition-colors cursor-pointer w-full">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-[#dcdad3] mt-10 pt-6 flex flex-col md:flex-row justify-between items-center text-xs gap-4">
          <div>© 2024 Harvest Hill Supply Chain. All rights reserved.</div>
          <div className="flex gap-4 text-[#414942]/80">
            <span>Secure Payments via FarmPay</span>
            <span>|</span>
            <span>English (US)</span>
          </div>
        </div>
      </footer>
    );
  }

  // Default / Dashboard Footer
  return (
    <footer className="bg-[#e9e6df] border-t border-[#dcdad3] py-12 text-[#414942] font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Col 1: Logo */}
        <div className="space-y-4">
          <h3
            onClick={() => onNavigate('landing')}
            className="text-2xl font-bold text-[#144227] cursor-pointer hover:opacity-85"
          >
            Harvest Hill
          </h3>
          <p className="text-sm leading-relaxed text-[#414942]/90 max-w-xs">
            Bridging the gap between artisanal local farms and high-end culinary professionals through a transparent supply chain.
          </p>
        </div>

        {/* Col 2: Explore */}
        <div>
          <h4 className="font-bold text-[#144227] text-xs uppercase tracking-wider mb-4">Explore</h4>
          <ul className="space-y-2 text-sm">
            <li><button onClick={() => onNavigate('catalog')} className="hover:text-[#144227] transition-colors cursor-pointer text-left">Quality Assurance</button></li>
            <li><button onClick={() => onNavigate('dashboard')} className="hover:text-[#144227] transition-colors cursor-pointer text-left">Support Center</button></li>
            <li><button onClick={() => onNavigate('order-history')} className="hover:text-[#144227] transition-colors cursor-pointer text-left">Order History</button></li>
          </ul>
        </div>

        {/* Col 3: Legal */}
        <div>
          <h4 className="font-bold text-[#144227] text-xs uppercase tracking-wider mb-4">Legal</h4>
          <ul className="space-y-2 text-sm">
            <li><button onClick={() => onNavigate('delivery-note')} className="hover:text-[#144227] transition-colors cursor-pointer text-left">Shipping Policy</button></li>
            <li><button onClick={() => onNavigate('invoices')} className="hover:text-[#144227] transition-colors cursor-pointer text-left">Billing & Invoices</button></li>
          </ul>
        </div>

        {/* Col 4: Market Status */}
        <div className="bg-[#f2efe7] border border-[#dcdad3] rounded-xl p-5 shadow-sm space-y-3 max-w-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs uppercase tracking-wider text-[#144227]">Market Status</span>
            <div className="flex items-center gap-1.5 bg-white border border-[#c1c9c0] py-0.5 px-2 rounded-full text-[10px] font-bold text-[#376847]">
              <span className="w-1.5 h-1.5 bg-[#376847] rounded-full animate-pulse"></span>
              Open for Dispatch
            </div>
          </div>
          <p className="text-xs text-[#414942] leading-relaxed">
            Orders placed before 2PM will be scheduled for next-day sunrise delivery.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-[#dcdad3] mt-10 pt-6 text-center text-xs">
        © 2024 Harvest Hill Supply Chain. All rights reserved.
      </div>
    </footer>
  );
}
