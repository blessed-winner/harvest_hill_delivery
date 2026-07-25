"use client";

import { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Sprout, CreditCard, BellRing, Info, Save, Banknote, CheckCircle2, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { api, apiRequest } from '../lib/api';
import { cn } from '../lib/utils';
import CountryPhoneInput from '../../../components/CountryPhoneInput';
import { DefaultProfileAvatar } from '../../../components/DefaultProfileAvatar';

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
  phone: '+250 788 123 456',
  certificationsText: 'GAP Certified, Fair Trade',
  latitude: -1.9441,
  longitude: 30.0619,
  payment_method: 'MTN Mobile Money (MoMo)',
  payment_account_number: '+250 788 123 456',
  notify_new_demand: true,
  notify_negotiation_update: false,
  notify_payment_received: false,
};

export default function Settings() {
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileForm>(initialProfile);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);

  // Deletion States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

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

        if (data.avatar) {
          setAvatarPreview(data.avatar);
        }
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

    if (!profile.phone.trim()) {
      setStatusMessage('Please enter a valid contact phone number.');
      setIsSaving(false);
      return;
    }

    try {
      const res = await api.updateFarmerProfile({
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
        avatarFile: avatarFile ? avatarFile : (avatarRemoved ? 'remove' : null),
      });

      if (res?.avatar) {
        setAvatarPreview(res.avatar);
      } else if (avatarRemoved) {
        setAvatarPreview(null);
      }
      setAvatarFile(null);
      setAvatarRemoved(false);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('profile-updated'));
      }

      setStatusMessage('Profile successfully saved.');
    } catch (error) {
      console.error('Failed to save farm profile:', error);
      setStatusMessage('Could not save profile changes.');
    } finally {
      setIsSaving(false);
    }
  };

      const handleAccountDeletion = async () => {
        try {
          setDeletingAccount(true);
          await apiRequest('/api/accounts/me/', { method: 'DELETE' });
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_role');
          alert("Your account deletion has been scheduled. You will be logged out now.");
          window.location.href = '/login';
        } catch (err: any) {
          alert(err.message || "Failed to schedule account deletion");
        } finally {
          setDeletingAccount(false);
          setShowDeleteModal(false);
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

              {/* Profile Picture Upload & Remove Card */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-surface-container-low rounded-2xl border border-outline-variant">
                <div className="relative w-20 h-20 rounded-full overflow-hidden shrink-0 group">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Farmer Avatar"
                      className="w-full h-full object-cover border-2 border-primary rounded-full"
                    />
                  ) : (
                    <DefaultProfileAvatar className="w-20 h-20 border-2 border-primary" iconClassName="w-12 h-12" />
                  )}
                </div>
                <div className="flex flex-col gap-2 items-center sm:items-start text-center sm:text-left">
                  <span className="font-sans text-xs font-bold text-on-surface">Farmer Profile Picture</span>
                  <p className="font-sans text-[11px] text-on-surface-variant">JPG, PNG or GIF up to 5MB.</p>
                  <div className="flex items-center gap-2 mt-1">
                    <label className="px-3 py-1.5 bg-primary text-white rounded-lg font-sans text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer">
                      Upload Picture
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setAvatarFile(file);
                            setAvatarPreview(URL.createObjectURL(file));
                            setAvatarRemoved(false);
                          }
                        }}
                      />
                    </label>
                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setAvatarFile(null);
                          setAvatarPreview(null);
                          setAvatarRemoved(true);
                        }}
                        className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg font-sans text-xs font-bold hover:bg-red-200 transition-all cursor-pointer"
                      >
                        Remove Picture
                      </button>
                    )}
                  </div>
                </div>
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
                  <div>
                    <CountryPhoneInput
                      label="Contact Phone"
                      value={profile.phone}
                      onChange={(val) => setProfile((current) => ({ ...current, phone: val }))}
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



              <div className="space-y-4">
                <label className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Active Certifications</label>
                <div className="space-y-3">
                  <input 
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low font-sans text-sm focus:border-primary outline-none transition-all" 
                    type="text" 
                    value={profile.certificationsText} 
                    onChange={(event) => setProfile((current) => ({ ...current, certificationsText: event.target.value }))}
                    placeholder="GAP Certified, RSB Organic, USDA Organic, Fair Trade"
                  />
                  
                  {/* Select your certifications */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    {['GAP Certified', 'RSB Organic', 'Organic Certified', 'Fair Trade', 'RAA Certified'].map((certOption) => {
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
                  <div className="space-y-4">
                    <label className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Default Payout Method for Invoices</label>
                    <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[9px] uppercase font-bold tracking-wider text-on-surface-variant mb-1">Payment Provider / Method</label>
                          <select
                            value={profile.payment_method}
                            onChange={(e) => setProfile(current => ({ ...current, payment_method: e.target.value }))}
                            className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg font-sans text-sm focus:border-primary outline-none"
                          >
                            <option value="MTN Mobile Money (MoMo)">MTN Mobile Money (MoMo)</option>
                            <option value="Airtel Money">Airtel Money</option>
                            <option value="Bank Transfer (Bank of Kigali)">Bank Transfer (Bank of Kigali)</option>
                            <option value="Bank Transfer (I&M Bank)">Bank Transfer (I&M Bank)</option>
                            <option value="Bank Transfer (Equity Bank)">Bank Transfer (Equity Bank)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase font-bold tracking-wider text-on-surface-variant mb-1">Account Number / Phone</label>
                          <input
                            type="text"
                            value={profile.payment_account_number}
                            onChange={(e) => setProfile(current => ({ ...current, payment_account_number: e.target.value }))}
                            placeholder="E.g. +250 788 123 456 or BK Account #..."
                            className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg font-sans text-sm focus:border-primary outline-none"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 pt-2 border-t border-outline-variant/40">
                        <div className="w-10 h-7 bg-white border border-outline-variant rounded flex items-center justify-center p-1 shrink-0">
                          <Banknote size={20} className="text-primary" />
                        </div>
                        <div>
                          <p className="font-sans text-xs font-bold text-on-surface">Active Method: {profile.payment_method || 'MTN Mobile Money'}</p>
                          <p className="font-mono text-[10px] text-on-surface-variant">{profile.payment_account_number || 'No account number set'}</p>
                        </div>
                      </div>
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
              <button 
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="px-5 py-3 rounded-xl border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 font-bold font-sans text-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <Trash2 size={16} />
                Delete Account
              </button>
              <div className="flex gap-4 w-full sm:w-auto justify-end">
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

          {/* DELETION CONFIRMATION MODAL */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99] flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-outline-variant shadow-2xl space-y-4">
                <div className="flex items-center gap-3 text-red-600">
                  <div className="p-2 bg-red-50 rounded-xl">
                    <AlertTriangle size={24} />
                  </div>
                  <h3 className="text-base font-extrabold text-[#1c1c18]">Confirm Account Deletion</h3>
                </div>
                
                <p className="text-xs text-[#717971] leading-relaxed">
                  Are you absolutely sure you want to delete your farmer account? Your account will be deactivated immediately and permanently removed after <strong>10 days</strong>.
                </p>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 border border-outline-variant text-xs font-bold rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={deletingAccount}
                    onClick={handleAccountDeletion}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-2"
                  >
                    {deletingAccount ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      "Yes, Delete Account"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      );
    }
