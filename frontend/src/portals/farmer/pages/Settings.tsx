"use client";

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Sprout, CreditCard, BellRing, Info, Save, Banknote, CheckCircle2, PlusCircle } from 'lucide-react';
import { api } from '../lib/api';

type ProfileForm = {
  farm_name: string;
  location: string;
  certificationsText: string;
  payment_method: string;
  payment_account_number: string;
  notify_new_demand: boolean;
  notify_negotiation_update: boolean;
  notify_payment_received: boolean;
};

const initialProfile: ProfileForm = {
  farm_name: 'Green Valley Organic Farms Ltd.',
  location: '1248 Vineyard Lane, St. Helena, CA',
  certificationsText: 'USDA Organic, Fair Trade',
  payment_method: 'AgriBank Savings',
  payment_account_number: '**** **** 8829',
  notify_new_demand: true,
  notify_negotiation_update: false,
  notify_payment_received: false,
};

export default function Settings() {
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileForm>(initialProfile);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        const data = await api.farmerProfile();
        if (!mounted) return;

        setProfile({
          farm_name: data.farm_name || initialProfile.farm_name,
          location: data.location || initialProfile.location,
          certificationsText: Array.isArray(data.certifications) ? data.certifications.join(', ') : initialProfile.certificationsText,
          payment_method: data.payment_method || initialProfile.payment_method,
          payment_account_number: data.payment_account_number || initialProfile.payment_account_number,
          notify_new_demand: Boolean(data.notify_new_demand),
          notify_negotiation_update: Boolean(data.notify_negotiation_update),
          notify_payment_received: Boolean(data.notify_payment_received),
        });
      } catch (error) {
        console.error('Failed to load farm profile:', error);
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMessage(null);

    try {
      await api.updateFarmerProfile({
        farm_name: profile.farm_name,
        location: profile.location,
        certifications: profile.certificationsText
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        payment_method: profile.payment_method,
        payment_account_number: profile.payment_account_number,
        notify_new_demand: profile.notify_new_demand,
        notify_negotiation_update: profile.notify_negotiation_update,
        notify_payment_received: profile.notify_payment_received,
      });

      setStatusMessage('Profile saved in local mock data.');
    } catch (error) {
      console.error('Failed to save farm profile:', error);
      setStatusMessage('Could not save settings right now.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 max-w-6xl mx-auto pb-48 sm:pb-32"
    >
      <header className="mb-6 sm:mb-8">
        <h1 className="font-sans text-xl sm:text-2xl font-extrabold text-primary">Profile & Settings</h1>
        <p className="font-sans text-xs sm:text-sm text-on-surface-variant mt-1">Manage your farm's identity, payment preferences, and alert configurations.</p>
        {statusMessage && (
          <div className="mt-4 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm text-on-surface">
            {statusMessage}
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Section 1: Farm Profile */}
        <div className="bg-surface-container-lowest p-4 sm:p-6 rounded-xl border border-outline-variant custom-shadow flex flex-col gap-6 sm:gap-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Sprout size={24} />
            </div>
            <h3 className="font-sans text-lg font-bold text-on-surface">Farm Profile</h3>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Farm Legal Name</label>
              <input 
                className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low font-sans text-sm focus:border-primary outline-none transition-all" 
                type="text" 
                value={profile.farm_name}
                onChange={(event) => setProfile((current) => ({ ...current, farm_name: event.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <label className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Contact Phone</label>
                <input className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low font-sans text-sm focus:border-primary outline-none" type="tel" defaultValue="+1 (555) 012-3456" />
              </div>
              <div className="space-y-2">
                <label className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Primary Email</label>
                <input className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low font-sans text-sm focus:border-primary outline-none" type="email" defaultValue="admin@greenvalley.farm" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Farm Location</label>
            <div className="relative rounded-xl overflow-hidden group border border-outline-variant h-48 bg-[radial-gradient(circle_at_top_left,_rgba(180,230,200,0.7),_transparent_45%),linear-gradient(135deg,_#d8e8da_0%,_#b7d3bf_100%)]">
              <div className="absolute inset-0 opacity-35 bg-[linear-gradient(transparent_24px,rgba(20,66,39,0.16)_25px),linear-gradient(90deg,transparent_24px,rgba(20,66,39,0.16)_25px)] bg-[size:48px_48px]" />
              <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 bg-white/90 backdrop-blur-md p-3 sm:p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-outline-variant shadow-lg">
                <span className="font-sans text-xs sm:text-sm text-primary font-extrabold">{profile.location}</span>
                <button className="text-primary hover:underline font-mono text-[10px] uppercase font-bold">Edit Map</button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Active Certifications</label>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {profile.certificationsText.split(',').map(cert => cert.trim()).filter(Boolean).map(cert => (
                <button key={cert} className="px-3 sm:px-5 py-2 rounded-full bg-primary text-on-primary font-mono text-[10px] uppercase font-bold flex items-center gap-2 shadow-sm">
                  <CheckCircle2 size={14} fill="currentColor" className="text-on-primary" />
                  {cert}
                </button>
              ))}
              {['Non-GMO Project', 'Rainforest Alliance'].map(cert => (
                <button key={cert} className="px-3 sm:px-5 py-2 rounded-full border-2 border-outline-variant text-on-surface-variant hover:bg-surface-container-low font-mono text-[10px] uppercase font-bold flex items-center gap-2 transition-all">
                  <PlusCircle size={14} />
                  {cert}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: Payments & Comms */}
        <div className="space-y-8">
          <div className="bg-surface-container-lowest p-4 sm:p-6 rounded-xl border border-outline-variant custom-shadow flex flex-col gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <CreditCard size={24} />
              </div>
              <h3 className="font-sans text-lg font-bold text-on-surface">Payment & Invoicing</h3>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Default Payout Method</label>
                <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl border border-outline-variant hover:border-primary transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-8 bg-white border border-outline-variant rounded flex items-center justify-center p-1">
                      <Banknote size={24} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-sans text-sm font-extrabold text-on-surface">{profile.payment_method}</p>
                      <p className="font-mono text-[10px] text-on-surface-variant tracking-widest uppercase">{profile.payment_account_number}</p>
                    </div>
                  </div>
                  <button className="text-primary font-mono text-[10px] uppercase font-bold hover:underline">Change</button>
                </div>
              </div>
              <div className="p-5 rounded-xl bg-tertiary-container/5 border border-tertiary-container/20 flex items-start gap-3">
                <Info size={20} className="text-tertiary shrink-0" />
                <p className="font-sans text-sm text-on-tertiary-fixed-variant leading-relaxed">
                  Invoices are generated automatically on the 1st of every month for all completed deliveries.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-4 sm:p-6 rounded-xl border border-outline-variant custom-shadow flex flex-col gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <BellRing size={24} />
              </div>
              <h3 className="font-sans text-lg font-bold text-on-surface">Communication Prefs</h3>
            </div>
              <div className="divide-y divide-outline-variant">
                {[
                  { key: 'notify_new_demand', title: 'SMS Notifications', desc: 'Real-time alerts for new demand submissions.' },
                  { key: 'notify_negotiation_update', title: 'Email Digest', desc: 'Weekly summary of negotiations and supplies.' },
                  { key: 'notify_payment_received', title: 'Marketing & Tips', desc: 'Updates about new platform features.' }
                ].map((toggle, i) => (
                  <div key={i} className="py-3 sm:py-4 flex items-center justify-between group">
                    <div className="mr-4">
                      <p className="font-sans text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{toggle.title}</p>
                      <p className="font-sans text-[11px] sm:text-xs text-on-surface-variant">{toggle.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profile[toggle.key as keyof ProfileForm] as boolean}
                        onChange={(event) => setProfile((current) => ({ ...current, [toggle.key]: event.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
        </div>
      </div>

      <footer className="fixed bottom-16 lg:bottom-0 left-0 right-0 lg:left-[224px] bg-white border-t border-outline-variant p-4 sm:p-5 z-30 shadow-[0px_-4px_20px_rgba(45,90,61,0.08)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <p className="hidden sm:block font-mono text-[10px] uppercase text-on-surface-variant font-bold">Last saved: 12 mins ago</p>
          <div className="flex gap-4 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none px-6 sm:px-10 py-2.5 sm:py-3 rounded-xl border-2 border-primary text-primary font-bold font-sans text-sm hover:bg-surface-container-low transition-all active:scale-95">Discard Changes</button>
            <button 
              onClick={handleSave}
              className="flex-1 sm:flex-none px-6 sm:px-10 py-2.5 sm:py-3 rounded-xl bg-primary text-on-primary font-bold font-sans text-sm shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}
