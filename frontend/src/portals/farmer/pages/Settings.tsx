"use client";

import { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Sprout, CreditCard, BellRing, Info, Save, Banknote, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';
import { cn } from '../lib/utils';

type ProfileForm = {
  farm_name: string;
  location: string;
  phone: string;
  certificationsText: string;
  latitude: number | null;
  longitude: number | null;
  payment_method: string;
  payment_account_number: string;
  notify_new_demand: boolean;
  notify_negotiation_update: boolean;
  notify_payment_received: boolean;
};

const initialProfile: ProfileForm = {
  farm_name: 'Green Valley Organic Farms Ltd.',
  location: 'Kigali, Rwanda',
  phone: '+250 781 234 567',
  certificationsText: 'USDA Organic, Fair Trade',
  latitude: -1.9441,
  longitude: 30.0619,
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
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        const data = await api.farmerProfile();
        if (!mounted) return;

        setProfile({
          farm_name: data.farm_name || initialProfile.farm_name,
          location: data.location || initialProfile.location,
          phone: data.phone || initialProfile.phone,
          certificationsText: Array.isArray(data.certifications) 
            ? data.certifications.join(', ') 
            : data.certificationsText || initialProfile.certificationsText,
          latitude: data.latitude !== null ? Number(data.latitude) : initialProfile.latitude,
          longitude: data.longitude !== null ? Number(data.longitude) : initialProfile.longitude,
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

  // Initialize Leaflet Map
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      const L = (window as any).L;
      if (!L || !document.getElementById('farm-map')) return;

      const currentLat = profile.latitude || -1.9441;
      const currentLng = profile.longitude || 30.0619;

      if (mapRef.current) {
        mapRef.current.setView([currentLat, currentLng], 13);
        if (markerRef.current) {
          markerRef.current.setLatLng([currentLat, currentLng]);
        }
        return;
      }

      const map = L.map('farm-map').setView([currentLat, currentLng], 13);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      const marker = L.marker([currentLat, currentLng], { draggable: true }).addTo(map);
      markerRef.current = marker;

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        setProfile(current => ({
          ...current,
          latitude: Number(pos.lat.toFixed(6)),
          longitude: Number(pos.lng.toFixed(6))
        }));
      });

      map.on('click', (e: any) => {
        marker.setLatLng(e.latlng);
        setProfile(current => ({
          ...current,
          latitude: Number(e.latlng.lat.toFixed(6)),
          longitude: Number(e.latlng.lng.toFixed(6))
        }));
      });
    };

    document.body.appendChild(script);

    return () => {
      link.remove();
      script.remove();
    };
  }, [profile.latitude, profile.longitude]);

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMessage(null);

    const phoneClean = profile.phone.replace(/\s+/g, '');
    const phoneRegex = /^\+2507[2389]\d{7}$/;
    if (!phoneRegex.test(phoneClean)) {
      setStatusMessage('Invalid Phone Number. Please use Rwandan format: +250 7XX XXX XXX');
      setIsSaving(false);
      return;
    }

    try {
      await api.updateFarmerProfile({
        farm_name: profile.farm_name,
        location: profile.location,
        phone: profile.phone,
        certifications: profile.certificationsText,
        latitude: profile.latitude,
        longitude: profile.longitude,
        payment_method: profile.payment_method,
        payment_account_number: profile.payment_account_number,
        notify_new_demand: profile.notify_new_demand,
        notify_negotiation_update: profile.notify_negotiation_update,
        notify_payment_received: profile.notify_payment_received,
      });

      setStatusMessage('Profile successfully saved.');
    } catch (error) {
      console.error('Failed to save farm profile:', error);
      setStatusMessage('Could not save profile changes.');
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
        <p className="font-sans text-xs sm:text-sm text-on-surface-variant mt-1">Manage your farm's identity, map coordinates, and certifications.</p>
        {statusMessage && (
          <div className="mt-4 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm font-sans font-bold text-primary shadow-sm">
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
                <label className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Contact Phone (Rwandan)</label>
                <input 
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low font-sans text-sm focus:border-primary outline-none transition-all" 
                  type="tel" 
                  value={profile.phone} 
                  onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))}
                  placeholder="+250 7XX XXX XXX"
                />
              </div>
              <div className="space-y-2">
                <label className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Farm General Location</label>
                <input 
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low font-sans text-sm focus:border-primary outline-none transition-all" 
                  type="text" 
                  value={profile.location} 
                  onChange={(event) => setProfile((current) => ({ ...current, location: event.target.value }))}
                  placeholder="Kigali, Rwanda"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant font-bold flex items-center justify-between">
              <span>Interactive Location Map</span>
              {profile.latitude && profile.longitude && (
                <span className="text-[9px] text-[#414942]">GPS: {profile.latitude}, {profile.longitude}</span>
              )}
            </label>
            <div className="relative rounded-2xl overflow-hidden border border-outline-variant h-56 bg-surface-container-high z-10">
              <div id="farm-map" className="w-full h-full" />
            </div>
          </div>

          <div className="space-y-4">
            <label className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Active Certifications</label>
            <div className="space-y-3">
              <input 
                className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low font-sans text-sm focus:border-primary outline-none transition-all" 
                type="text" 
                value={profile.certificationsText} 
                onChange={(event) => setProfile((current) => ({ ...current, certificationsText: event.target.value }))}
                placeholder="Rwanda GAP, RSB Organic, USDA Organic, Fair Trade"
              />
              
              {/* Rwanda-specific Certification Selection Pills */}
              <div className="flex flex-wrap gap-2 text-xs">
                {['Rwanda GAP', 'RSB Organic', 'Fair Trade', 'USDA Organic'].map((certOption) => {
                  const currentCerts = profile.certificationsText.split(',').map(c => c.trim().toLowerCase());
                  const isSelected = currentCerts.includes(certOption.toLowerCase());
                  return (
                    <button
                      key={certOption}
                      type="button"
                      onClick={() => {
                        let newCerts = profile.certificationsText.split(',').map(c => c.trim()).filter(Boolean);
                        if (isSelected) {
                          newCerts = newCerts.filter(c => c.toLowerCase() !== certOption.toLowerCase());
                        } else {
                          newCerts.push(certOption);
                        }
                        setProfile(current => ({ ...current, certificationsText: newCerts.join(', ') }));
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-full border transition-all font-sans font-bold cursor-pointer text-xs",
                        isSelected 
                          ? "bg-primary text-white border-primary" 
                          : "bg-white border-outline-variant text-on-surface-variant hover:bg-surface-container-low"
                      )}
                    >
                      {isSelected ? '✓ ' : ''}{certOption}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {profile.certificationsText.split(',').map(cert => cert.trim()).filter(Boolean).map(cert => (
                  <span key={cert} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary font-mono text-[9px] uppercase font-extrabold flex items-center gap-1.5 border border-primary/20">
                    <CheckCircle2 size={12} className="text-primary" />
                    {cert}
                  </span>
                ))}
              </div>
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
              <div className="p-5 rounded-xl bg-tertiary-container/10 border border-tertiary-container/20 flex items-start gap-3">
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

      <footer className="fixed bottom-16 lg:bottom-0 left-0 right-0 lg:left-[260px] bg-white border-t border-outline-variant p-4 sm:p-5 z-30 shadow-[0px_-4px_20px_rgba(45,90,61,0.08)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <p className="hidden sm:block font-mono text-[10px] uppercase text-on-surface-variant font-bold">Profile Details</p>
          <div className="flex gap-4 w-full sm:w-auto">
            <button 
              onClick={handleSave}
              className="w-full sm:w-auto px-10 py-3 rounded-xl bg-primary text-on-primary font-bold font-sans text-sm shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={18} />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}
