"use client";

import { useState } from 'react';
import Link from 'next/link';
import { User, Sprout, MapPin, Send, Eye, Truck, Check } from 'lucide-react';

export default function ApplyPage() {
  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [farmName, setFarmName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  
  // Interactive pills
  const [crops, setCrops] = useState<string[]>([]);
  const [certs, setCerts] = useState<string[]>([]);
  
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const cropOptions = ['Vegetables', 'Fruits', 'Dairy', 'Grains', 'Herbs'];
  const certOptions = ['Organic', 'Fair Trade', 'None'];

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulate API request
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#fcf9f2] font-sans flex flex-col justify-between">
      {/* Header */}
      <header className="bg-[#fcf9f2]/80 backdrop-blur-md sticky top-0 z-50 border-b border-[#e5e2db] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[#144227] font-bold text-2xl tracking-tight">Harvest Hill</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-[#414942] text-sm font-semibold">
          <Link href="#" className="hover:text-[#144227] transition-colors">Our Farms</Link>
          <Link href="#" className="hover:text-[#144227] transition-colors">Marketplace</Link>
          <Link href="#" className="hover:text-[#144227] transition-colors">Delivery Info</Link>
          <Link href="#" className="hover:text-[#144227] transition-colors">FAQ</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-[#414942] hover:text-[#144227] text-sm font-bold transition-colors">Log In</Link>
          <Link href="/farmer" className="bg-[#144227] text-white hover:bg-[#224f33] px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm">
            Farmer Portal
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12 flex-1 w-full">
        {/* Intro */}
        <div className="text-center mb-12 space-y-3">
          <span className="text-[11px] font-bold tracking-widest text-[#3b6d4b] uppercase">Suppliers</span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#144227] tracking-tight">Grow with Harvest Hill</h1>
          <p className="text-sm md:text-base text-[#717971] max-w-2xl mx-auto leading-relaxed">
            We connect independent local farms with thousands of families seeking fresh, sustainable produce. Join our network of quality-first growers.
          </p>
        </div>

        {/* Steps Progress */}
        <div className="flex items-center justify-center gap-4 max-w-md mx-auto mb-12 text-xs font-semibold text-[#717971]">
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="w-10 h-10 rounded-full bg-[#e5e2db] flex items-center justify-center text-[#144227] border-2 border-[#144227]/20 shadow-sm">
              <Check size={16} />
            </div>
            <span className="text-[#144227] font-bold">Apply</span>
          </div>
          <div className="h-0.5 border-t-2 border-dotted border-[#c1c9c0] flex-1 mb-6"></div>
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="w-10 h-10 rounded-full bg-[#f0eee7] flex items-center justify-center text-[#717971] border border-[#c1c9c0]">
              <Eye size={16} />
            </div>
            <span>We review</span>
          </div>
          <div className="h-0.5 border-t-2 border-dotted border-[#c1c9c0] flex-1 mb-6"></div>
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="w-10 h-10 rounded-full bg-[#f0eee7] flex items-center justify-center text-[#717971] border border-[#c1c9c0]">
              <Truck size={16} />
            </div>
            <span>Start supplying</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-[#e5e2db] rounded-[32px] p-6 md:p-12 shadow-md max-w-2xl mx-auto">
          {submitted ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-[#bceec8] text-[#00210f] rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Check size={32} />
              </div>
              <h2 className="text-2xl font-bold text-[#144227]">Application Submitted!</h2>
              <p className="text-sm text-[#717971] max-w-md mx-auto leading-relaxed">
                Thank you for applying to be a supplier. Our team will review your contact information and farm details, and we'll reach out within 2-3 business days.
              </p>
              <Link href="/" className="inline-block mt-4 text-[#144227] font-bold hover:underline">
                Return to home
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Contact Information Section */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 border-b border-[#e5e2db] pb-3">
                  <User size={18} className="text-[#144227]" />
                  <h3 className="font-bold text-base text-[#1c1c18]">Contact Information</h3>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#414942]">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Johnathan Appleseed"
                    className="w-full bg-white border border-[#c1c9c0] focus:border-[#144227] rounded-xl px-4 py-3 text-sm focus:outline-none transition-all placeholder-[#c1c9c0]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#414942]">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full bg-white border border-[#c1c9c0] focus:border-[#144227] rounded-xl px-4 py-3 text-sm focus:outline-none transition-all placeholder-[#c1c9c0]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#414942]">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(555) 000-0000"
                      className="w-full bg-white border border-[#c1c9c0] focus:border-[#144227] rounded-xl px-4 py-3 text-sm focus:outline-none transition-all placeholder-[#c1c9c0]"
                    />
                  </div>
                </div>
              </div>

              {/* Farm Details Section */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 border-b border-[#e5e2db] pb-3">
                  <Sprout size={18} className="text-[#144227]" />
                  <h3 className="font-bold text-base text-[#1c1c18]">Farm Details</h3>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#414942]">Farm Name</label>
                  <input
                    type="text"
                    required
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    placeholder="Harvest Hill Estates"
                    className="w-full bg-white border border-[#c1c9c0] focus:border-[#144227] rounded-xl px-4 py-3 text-sm focus:outline-none transition-all placeholder-[#c1c9c0]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#414942]">Location</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="City, State"
                      className="w-full bg-white border border-[#c1c9c0] focus:border-[#144227] rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none transition-all placeholder-[#c1c9c0]"
                    />
                    <MapPin size={16} className="absolute left-3.5 top-3.5 text-[#717971]" />
                  </div>
                </div>

                {/* What do you grow? */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#414942]">What do you grow? (Multi-select)</label>
                  <div className="flex flex-wrap gap-2">
                    {cropOptions.map((crop) => {
                      const isSelected = crops.includes(crop);
                      return (
                        <button
                          key={crop}
                          type="button"
                          onClick={() => toggleCrop(crop)}
                          className={`px-4 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${
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

                {/* Certifications */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#414942]">Certifications</label>
                  <div className="flex flex-wrap gap-2">
                    {certOptions.map((cert) => {
                      const isSelected = certs.includes(cert);
                      return (
                        <button
                          key={cert}
                          type="button"
                          onClick={() => toggleCert(cert)}
                          className={`px-4 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer ${
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
                </div>

                {/* Tell us about your farm */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#414942]">Tell us about your farm</label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Briefly describe your history, farming practices, and what makes your produce special..."
                    rows={4}
                    className="w-full bg-white border border-[#c1c9c0] focus:border-[#144227] rounded-xl px-4 py-3 text-sm focus:outline-none transition-all placeholder-[#c1c9c0] resize-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#144227] text-white hover:bg-[#224f33] disabled:opacity-50 py-3.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
                <Send size={12} className="rotate-45" />
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#f5f2eb] border-t border-[#e5e2db] py-8 px-6 mt-16 text-[#717971]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium">
          <div className="text-center md:text-left space-y-1">
            <p className="font-bold text-[#1c1c18]">Harvest Hill</p>
            <p>© 2024 Harvest Hill Delivery. Cultivating community through fresh produce.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-xs">
            <Link href="#" className="hover:text-[#1c1c18] transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-[#1c1c18] transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-[#1c1c18] transition-colors">Supplier Guidelines</Link>
            <Link href="#" className="hover:text-[#1c1c18] transition-colors">Accessibility</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
