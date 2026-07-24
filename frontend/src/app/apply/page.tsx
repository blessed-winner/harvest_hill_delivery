"use client";

import { useState } from 'react';
import Link from 'next/link';
import { User, Sprout, MapPin, Send, Eye, Truck, Check, Award } from 'lucide-react';

export default function ApplyPage() {
  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [farmName, setFarmName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Interactive pills
  const [crops, setCrops] = useState<string[]>([]);
  const [certs, setCerts] = useState<string[]>([]);
  const [customCert, setCustomCert] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const cropOptions = ['Vegetables', 'Fruits', 'Animal-Based', 'Grains', 'Herbs'];
  const certOptions = ['Rwanda GAP', 'RSB Organic', 'Rwanda Organic', 'Fair Trade Rwanda', 'RAA Certified', 'None'];

  const toggleCrop = (crop: string) => {
    if (crops.includes(crop)) {
      setCrops(crops.filter(c => c !== crop));
    } else {
      setCrops([...crops, crop]);
    }
  };

  const toggleCert = (cert: string) => {
    if (cert === 'None') {
      setCerts(['None']);
      return;
    }
    const newCerts = certs.filter(c => c !== 'None');
    if (newCerts.includes(cert)) {
      setCerts(newCerts.filter(c => c !== cert));
    } else {
      setCerts([...newCerts, cert]);
    }
  };

  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please check and try again.');
      setSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      setSubmitting(false);
      return;
    }

    const selectedCertsList = certs.filter(c => c !== 'None');
    if (customCert.trim()) {
      selectedCertsList.push(customCert.trim());
    }
    const finalCertificationsString = selectedCertsList.join(', ') || 'None';

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/accounts/farmer-applications/apply/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone,
          farm_name: farmName,
          location,
          crops: crops.join(', '),
          certifications: finalCertificationsString,
          description,
          password: password
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        const msg = errData.detail || errData.error || Object.values(errData).flat().join(' ') || 'Failed to submit application.';
        throw new Error(msg);
      }

      setSubmitted(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcf9f2] font-sans flex flex-col justify-between selection:bg-[#9ed0ab]">
      {/* Redesigned Header: Only Home & Log In */}
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-[#e5e2db] px-6 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-[#144227] font-extrabold text-xl tracking-tight">Harvest Hill</span>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#717971] bg-[#f0eee7] px-2 py-0.5 rounded">Supplier Hub</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-[#144227] hover:bg-[#f6f3ec] px-4 py-2 rounded-xl text-xs font-bold transition-all border border-[#144227]/20">
            Home
          </Link>
          <Link href="/login" className="bg-[#144227] text-white hover:bg-[#2d5a3d] px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm">
            Sign In
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        {/* Compact Intro */}
        <div className="text-center space-y-2">
          <span className="text-[10px] font-extrabold tracking-widest text-[#144227] bg-[#eef7f0] px-3 py-1 rounded-full uppercase">
            GROWER PARTNERSHIP
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#144227] tracking-tight">Supplier Application</h1>
          <p className="text-xs text-[#717971] max-w-lg mx-auto font-medium">
            Join the Harvest Hill agricultural network to list verified crops, negotiate bulk supply contracts, and receive automated ledger payouts.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-[#e5e2db] rounded-2xl p-6 sm:p-8 shadow-sm">
          {submitted ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 bg-[#bceec8] text-[#00210f] rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Check size={24} />
              </div>
              <h2 className="text-xl font-bold text-[#144227]">Application Submitted Successfully</h2>
              <p className="text-xs text-[#717971] max-w-md mx-auto leading-relaxed">
                Thank you for applying. Our verification team will review your farm details and credentials. You will receive an update within 24 hours.
              </p>
              <Link href="/" className="inline-block mt-2 text-xs text-[#144227] font-bold hover:underline">
                Return to Homepage
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-[#ffdad6] text-[#93000a] text-xs font-bold p-3.5 rounded-xl border border-[#ba1a1a]/30">
                  {error}
                </div>
              )}

              {/* Contact Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-[#f0eee7] pb-2">
                  <User size={16} className="text-[#144227]" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[#1c1c18]">1. Contact & Credentials</h3>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#717971]">Full Representative Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="E.g. Jean-Claude Habimana"
                    className="w-full bg-[#f6f3ec]/50 border border-[#c1c9c0] focus:border-[#144227] rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#717971]">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="farmer@domain.rw"
                      className="w-full bg-[#f6f3ec]/50 border border-[#c1c9c0] focus:border-[#144227] rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#717971]">Rwandan Phone (+250)</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+250 788 000 000"
                      className="w-full bg-[#f6f3ec]/50 border border-[#c1c9c0] focus:border-[#144227] rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#717971]">Account Password</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      minLength={6}
                      className="w-full bg-[#f6f3ec]/50 border border-[#c1c9c0] focus:border-[#144227] rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#717971]">Confirm Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      minLength={6}
                      className="w-full bg-[#f6f3ec]/50 border border-[#c1c9c0] focus:border-[#144227] rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Farm Section */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 border-b border-[#f0eee7] pb-2">
                  <Sprout size={16} className="text-[#144227]" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[#1c1c18]">2. Farm Profile & Certifications</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#717971]">Registered Farm Name</label>
                    <input
                      type="text"
                      required
                      value={farmName}
                      onChange={(e) => setFarmName(e.target.value)}
                      placeholder="E.g. Musanze Organic Cooperative"
                      className="w-full bg-[#f6f3ec]/50 border border-[#c1c9c0] focus:border-[#144227] rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#717971]">General Farm Location</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="District, Province (e.g. Musanze, Northern)"
                        className="w-full bg-[#f6f3ec]/50 border border-[#c1c9c0] focus:border-[#144227] rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-semibold focus:outline-none transition-all"
                      />
                      <MapPin size={14} className="absolute left-3 top-3 text-[#717971]" />
                    </div>
                  </div>
                </div>

                {/* Crops */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#717971]">Primary Crop Categories</label>
                  <div className="flex flex-wrap gap-1.5">
                    {cropOptions.map((crop) => {
                      const isSelected = crops.includes(crop);
                      return (
                        <button
                          key={crop}
                          type="button"
                          onClick={() => toggleCrop(crop)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#144227] border-[#144227] text-white'
                              : 'bg-white border-[#c1c9c0] text-[#414942] hover:border-[#144227]'
                          }`}
                        >
                          {crop}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Rwanda Certifications */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#717971]">Rwanda Agricultural Certifications</label>
                  <div className="flex flex-wrap gap-1.5">
                    {certOptions.map((cert) => {
                      const isSelected = certs.includes(cert);
                      return (
                        <button
                          key={cert}
                          type="button"
                          onClick={() => toggleCert(cert)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#144227] border-[#144227] text-white'
                              : 'bg-white border-[#c1c9c0] text-[#414942] hover:border-[#144227]'
                          }`}
                        >
                          {cert}
                        </button>
                      );
                    })}
                  </div>

                  {/* Optional Custom Certification */}
                  <div className="pt-2">
                    <label className="block text-[10px] font-bold text-[#717971] mb-1">Custom Certification (Optional)</label>
                    <input
                      type="text"
                      value={customCert}
                      onChange={(e) => setCustomCert(e.target.value)}
                      placeholder="Type custom accreditation name..."
                      className="w-full bg-[#f6f3ec]/40 border border-[#c1c9c0] focus:border-[#144227] rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none transition-all placeholder-[#717971]/60"
                    />
                  </div>
                </div>

                {/* Farm Description */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#717971]">Farm Practices & Overview</label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Briefly state production capacity, harvest schedules, and soil/cultivation standards..."
                    rows={3}
                    className="w-full bg-[#f6f3ec]/50 border border-[#c1c9c0] focus:border-[#144227] rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none transition-all resize-none"
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#144227] text-white hover:bg-[#2d5a3d] disabled:opacity-50 py-3 rounded-xl text-xs font-bold tracking-wider uppercase transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? 'Submitting Application...' : 'Submit Application'}
                  <Send size={14} />
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* Compact Footer */}
      <footer className="bg-white border-t border-[#e5e2db] py-4 px-6 text-[#717971]">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-[11px] font-semibold">
          <p>© 2026 Harvest Hill Delivery. All Rights Reserved.</p>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-[#144227]">Terms</Link>
            <Link href="/" className="hover:text-[#144227]">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
