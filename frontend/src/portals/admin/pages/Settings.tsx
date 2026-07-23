"use client";

import React, { useState, useEffect } from 'react';
import { Shield, Key, Bell, ShieldAlert, Upload, User, Check, Eye, EyeOff } from 'lucide-react';
import { api } from '../lib/api';
import { useAlert } from '../../../context/AlertContext';

interface SettingsProps {
  onProfileUpdate?: (name: string, photo: string | null) => void;
}

export function SettingsPage({ onProfileUpdate }: SettingsProps) {
  const { toast } = useAlert();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    photo: null as string | null,
    date_joined: '',
  });

  // Settings State
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notifyNewOrders, setNotifyNewOrders] = useState(true);
  const [notifyApprovals, setNotifyApprovals] = useState(true);
  const [notifyFailedSyncs, setNotifyFailedSyncs] = useState(false);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
  });

  // Password Modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPass, setShowPass] = useState(false);

  // Load preferences and profile on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const me = await api.me();
        if (me) {
          const loadedProfile = {
            username: me.username || '',
            email: me.email || '',
            first_name: me.first_name || '',
            last_name: me.last_name || '',
            photo: me.photo || me.avatar || null,
            date_joined: me.date_joined || me.created_at || 'Jan 12, 2022',
          };
          setProfile(loadedProfile);
          setEditForm({
            first_name: loadedProfile.first_name,
            last_name: loadedProfile.last_name,
            email: loadedProfile.email,
            username: loadedProfile.username,
          });
        }

        // Load settings from localStorage
        const storedNotif = localStorage.getItem('admin_notifications_enabled');
        if (storedNotif !== null) setNotificationsEnabled(storedNotif === 'true');

        const storedOrders = localStorage.getItem('admin_notify_orders');
        if (storedOrders !== null) setNotifyNewOrders(storedOrders === 'true');

        const storedApprovals = localStorage.getItem('admin_notify_approvals');
        if (storedApprovals !== null) setNotifyApprovals(storedApprovals === 'true');

        const storedSyncs = localStorage.getItem('admin_notify_syncs');
        if (storedSyncs !== null) setNotifyFailedSyncs(storedSyncs === 'true');



      } catch (err) {
        console.error("Failed to load settings data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSaveSettings = () => {
    localStorage.setItem('admin_notifications_enabled', String(notificationsEnabled));
    localStorage.setItem('admin_notify_orders', String(notifyNewOrders));
    localStorage.setItem('admin_notify_approvals', String(notifyApprovals));
    localStorage.setItem('admin_notify_syncs', String(notifyFailedSyncs));

    toast("Settings saved successfully", "success");
    
    // Dispatch event to trigger TopBar updates
    window.dispatchEvent(new Event('admin_settings_changed'));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.updateMe({
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        email: editForm.email,
        username: editForm.username,
      });
      if (res) {
        setProfile(prev => ({
          ...prev,
          first_name: res.first_name || '',
          last_name: res.last_name || '',
          email: res.email || '',
          username: res.username || '',
        }));
        setIsEditing(false);
        toast("Profile updated successfully", "success");
        if (onProfileUpdate) {
          onProfileUpdate(`${res.first_name} ${res.last_name}`.trim() || res.username, profile.photo);
        }
      }
    } catch (err: any) {
      toast(err.message || "Failed to update profile", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        try {
          setLoading(true);
          const res = await api.updateMe({ photo: base64 });
          if (res) {
            setProfile(prev => ({ ...prev, photo: base64 }));
            toast("Profile picture updated", "success");
            if (onProfileUpdate) {
              const name = `${profile.first_name} ${profile.last_name}`.trim() || profile.username;
              onProfileUpdate(name, base64);
            }
          }
        } catch (err: any) {
          toast("Failed to upload image", "error");
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast("New passwords do not match", "warning");
      return;
    }
    try {
      setLoading(true);
      await api.changePassword({
        old_password: passwordForm.oldPassword,
        new_password: passwordForm.newPassword,
      });
      setShowPasswordModal(false);
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      toast("Password changed successfully", "success");
    } catch (err: any) {
      toast(err.message || "Failed to change password", "error");
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = () => {
    try {
      return new Date(profile.date_joined).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return profile.date_joined;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 font-sans space-y-8 text-on-surface">
      <h1 className="text-2xl font-black text-[#144227] tracking-tight">Profile & Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT PANEL: PROFILE CARD */}
        <div className="lg:col-span-4 bg-white border border-outline-variant rounded-2xl p-6 shadow-sm flex flex-col items-center text-center space-y-5">
          <div className="relative group">
            {profile.photo ? (
              <img 
                src={profile.photo} 
                alt="Profile Avatar" 
                className="w-32 h-32 rounded-full object-cover border-2 border-outline"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-[#144227]/10 text-[#144227] border-2 border-outline-variant flex items-center justify-center shadow-inner">
                <User size={64} className="opacity-75" />
              </div>
            )}
            <label className="absolute bottom-0 right-0 p-2 bg-[#144227] text-white rounded-full cursor-pointer shadow-md hover:opacity-90 active:scale-95 transition-all">
              <Upload size={16} />
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
          </div>

          <div className="space-y-1 w-full">
            <h2 className="text-xl font-bold text-on-surface leading-tight">
              {profile.first_name || profile.last_name 
                ? `${profile.first_name} ${profile.last_name}`.trim() 
                : profile.username || 'System Admin'}
            </h2>
            <span className="inline-block text-[10px] font-extrabold tracking-wider bg-[#eef7f0] text-[#144227] px-3 py-1 rounded-full uppercase">
              ADMIN
            </span>
            <p className="text-xs text-on-surface-variant font-medium break-all pt-1">
              {profile.email}
            </p>
          </div>

          <button
            onClick={() => setIsEditing(prev => !prev)}
            className="w-full py-2.5 bg-[#144227] hover:bg-[#254b32] text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-[0.98] cursor-pointer"
          >
            {isEditing ? "View Profile" : "Edit Profile"}
          </button>

          <div className="border-t border-outline-variant/60 pt-4 w-full text-left text-xs space-y-2 text-on-surface-variant">
            <div className="flex justify-between">
              <span className="font-semibold">Member since</span>
              <span className="font-bold text-on-surface">{formattedDate()}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Inventory Access</span>
              <span className="font-bold text-[#144227]">Full Priority</span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: SETTINGS CONTROLS */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* PROFILE EDIT FORM (Conditional) */}
          {isEditing && (
            <form onSubmit={handleProfileSubmit} className="bg-white border border-outline-variant rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-primary border-b border-outline-variant pb-2">
                Edit Admin Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-on-surface-variant mb-1">First Name</label>
                  <input
                    type="text"
                    value={editForm.first_name}
                    onChange={e => setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
                    className="w-full bg-[#fcf9f2] border border-outline-variant rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-on-surface-variant mb-1">Last Name</label>
                  <input
                    type="text"
                    value={editForm.last_name}
                    onChange={e => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
                    className="w-full bg-[#fcf9f2] border border-outline-variant rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-on-surface-variant mb-1">Username</label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={e => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full bg-[#fcf9f2] border border-outline-variant rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-on-surface-variant mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-[#fcf9f2] border border-outline-variant rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-outline-variant rounded-lg text-xs font-bold hover:bg-[#fcf9f2] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#144227] hover:bg-[#254b32] text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          )}

          {/* SECTION 1: ACCOUNT SECURITY */}
          <div className="bg-white border border-outline-variant rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-outline-variant pb-3">
              <Key className="text-[#144227] w-5 h-5" />
              <h3 className="text-sm font-extrabold text-on-surface tracking-tight">Account Security</h3>
            </div>
            <div className="bg-[#fcf9f2] border border-outline-variant rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold">Password</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(true)}
                className="px-4 py-2 bg-white border border-outline-variant text-xs font-bold rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer"
              >
                Change Password
              </button>
            </div>
          </div>

          {/* SECTION 2: COMMUNICATION PREFERENCES */}
          <div className="bg-white border border-outline-variant rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-outline-variant pb-3 justify-between">
              <div className="flex items-center gap-2">
                <Bell className="text-[#144227] w-5 h-5" />
                <h3 className="text-sm font-extrabold text-on-surface tracking-tight">Communication Preferences</h3>
              </div>
              {/* Global Notifications Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-[10px] uppercase font-bold text-on-surface-variant">Notifications</span>
                <button
                  type="button"
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={`w-9 h-5 rounded-full transition-colors relative flex items-center shrink-0 ${
                    notificationsEnabled ? 'bg-[#9ed0ab]' : 'bg-[#e5e2db]'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full bg-white shadow absolute transition-all ${
                    notificationsEnabled ? 'left-5' : 'left-0.5'
                  }`} />
                </button>
              </label>
            </div>

            <div className="space-y-4 pt-1">
              {/* Option 1 */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold">Email me about new orders</p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">Receive a daily digest of all incoming supply orders.</p>
                </div>
                <button
                  type="button"
                  disabled={!notificationsEnabled}
                  onClick={() => setNotifyNewOrders(!notifyNewOrders)}
                  className={`w-9 h-5 rounded-full transition-colors relative flex items-center shrink-0 disabled:opacity-40 ${
                    notifyNewOrders && notificationsEnabled ? 'bg-[#144227]' : 'bg-[#e5e2db]'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full bg-white shadow absolute transition-all ${
                    notifyNewOrders && notificationsEnabled ? 'left-5' : 'left-0.5'
                  }`} />
                </button>
              </div>

              {/* Option 2 */}
              <div className="flex items-center justify-between border-t border-outline-variant/40 pt-4">
                <div>
                  <p className="text-xs font-bold">Email me about pending supply approvals</p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">Alerts for vendor contracts requiring administrative signature.</p>
                </div>
                <button
                  type="button"
                  disabled={!notificationsEnabled}
                  onClick={() => setNotifyApprovals(!notifyApprovals)}
                  className={`w-9 h-5 rounded-full transition-colors relative flex items-center shrink-0 disabled:opacity-40 ${
                    notifyApprovals && notificationsEnabled ? 'bg-[#144227]' : 'bg-[#e5e2db]'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full bg-white shadow absolute transition-all ${
                    notifyApprovals && notificationsEnabled ? 'left-5' : 'left-0.5'
                  }`} />
                </button>
              </div>

              {/* Option 3 */}
              <div className="flex items-center justify-between border-t border-outline-variant/40 pt-4">
                <div>
                  <p className="text-xs font-bold">Email me about failed invoice syncs</p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">Immediate notifications for ERP and ledger synchronization errors.</p>
                </div>
                <button
                  type="button"
                  disabled={!notificationsEnabled}
                  onClick={() => setNotifyFailedSyncs(!notifyFailedSyncs)}
                  className={`w-9 h-5 rounded-full transition-colors relative flex items-center shrink-0 disabled:opacity-40 ${
                    notifyFailedSyncs && notificationsEnabled ? 'bg-[#144227]' : 'bg-[#e5e2db]'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full bg-white shadow absolute transition-all ${
                    notifyFailedSyncs && notificationsEnabled ? 'left-5' : 'left-0.5'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 3: SYSTEM SECURITY */}
          <div className="bg-white border border-outline-variant rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-outline-variant pb-3">
              <Shield className="text-[#144227] w-5 h-5" />
              <h3 className="text-sm font-extrabold text-on-surface tracking-tight">System Security</h3>
            </div>

            <div className="border-t border-outline-variant/40 pt-4 flex items-center justify-between text-xs text-on-surface-variant font-semibold">
              <span>Last login info</span>
              <div className="text-right">
                <span className="block font-bold text-on-surface">Today at 09:42 AM</span>
                <span className="block text-[10px] mt-0.5">IP: 192.168.1.142 (Portland, OR)</span>
              </div>
            </div>
          </div>

          {/* SAVE BUTTONS */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSaveSettings}
              className="bg-[#144227] hover:bg-[#254b32] text-white px-8 py-3 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Save All Changes
            </button>
          </div>

        </div>

      </div>

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-outline-variant shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <h3 className="text-sm font-extrabold text-on-surface">Change Admin Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-on-surface-variant hover:text-on-surface cursor-pointer">✕</button>
            </div>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-on-surface-variant mb-1">Old Password</label>
                <input
                  type={showPass ? "text" : "password"}
                  required
                  value={passwordForm.oldPassword}
                  onChange={e => setPasswordForm(prev => ({ ...prev, oldPassword: e.target.value }))}
                  className="w-full bg-[#fcf9f2] border border-outline-variant rounded-lg px-3 py-2 text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-on-surface-variant mb-1">New Password</label>
                <input
                  type={showPass ? "text" : "password"}
                  required
                  value={passwordForm.newPassword}
                  onChange={e => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full bg-[#fcf9f2] border border-outline-variant rounded-lg px-3 py-2 text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-on-surface-variant mb-1">Confirm New Password</label>
                <input
                  type={showPass ? "text" : "password"}
                  required
                  value={passwordForm.confirmPassword}
                  onChange={e => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full bg-[#fcf9f2] border border-outline-variant rounded-lg px-3 py-2 text-xs focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
              >
                {showPass ? <EyeOff size={12}/> : <Eye size={12}/>} {showPass ? "Hide Passwords" : "Show Passwords"}
              </button>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 border border-outline-variant rounded-lg text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#144227] hover:bg-[#254b32] text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
