"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Sprout } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/accounts/password-reset/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Something went wrong. Please try again.');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit password reset request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-[#fcf9f2]">
      {/* Left panel - Image Sidebar */}
      <div 
        className="hidden md:flex md:w-[45%] lg:w-[50%] relative bg-cover bg-center items-between flex-col p-12 lg:p-16 select-none"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1000')` }}
      >
        {/* Darkening Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#144227]/95 via-[#144227]/40 to-[#144227]/20 z-10" />
        
        {/* Logo at Top Left */}
        <div className="relative z-20 flex items-center gap-2 text-white">
          <span className="font-bold text-2xl tracking-tight font-sans">Harvest Hill</span>
        </div>

        {/* Overlaid Text at Bottom Left */}
        <div className="relative z-20 text-white max-w-lg space-y-4 mt-auto">
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Freshness from our soil to your doorstep.
          </h2>
          <p className="text-white/80 text-sm lg:text-base font-medium leading-relaxed">
            Join a community of local farmers and conscious consumers dedicated to quality produce and sustainable living.
          </p>
        </div>
      </div>

      {/* Right panel - Form Content */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 lg:p-16">
        {/* Back Link */}
        <div className="flex justify-end">
          <Link 
            href="/login" 
            className="flex items-center gap-1.5 text-xs font-bold text-[#414942] hover:text-[#144227] transition-all"
          >
            <span className="inline-block w-4 h-4 rounded-full border border-[#c1c9c0] flex items-center justify-center text-[10px]">←</span> Back to login
          </Link>
        </div>

        {/* Form Container */}
        <div className="mx-auto w-full max-w-sm my-auto space-y-6">
          <div className="space-y-2">
            {!success ? (
              <>
                <h1 className="text-3xl md:text-4xl font-extrabold text-[#144227] tracking-tight">Reset your password</h1>
                <p className="text-xs text-[#717971] leading-relaxed">
                  Enter your email and we'll send you a link to reset it.
                </p>
              </>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#bceec8] text-[#00210f] flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-extrabold text-[#144227] tracking-tight">Link Sent Successfully</h1>
                <p className="text-xs text-[#717971] leading-relaxed">
                  If the email exists, a password reset link has been dispatched to <strong>{email}</strong>.
                </p>
              </div>
            )}
          </div>

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-[#ffdad6] text-[#93000a] text-xs font-bold p-3 rounded-xl border border-[#ba1a1a]/30">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#1c1c18]">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g., farmer@harvesthill.com"
                  className="w-full bg-white border border-[#c1c9c0] focus:border-[#144227] rounded-xl px-4 py-3.5 text-sm focus:outline-none transition-all placeholder-[#717971]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#144227] text-white hover:bg-[#224f33] disabled:opacity-50 py-3.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-colors shadow-md hover:shadow-lg cursor-pointer"
              >
                {loading ? 'Sending link...' : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <p className="text-xs text-[#717971] leading-relaxed">
              Didn't receive the email? Check your spam folder or try requesting it again.
            </p>
          )}

          {/* Bottom links and decorations */}
          <div className="text-center pt-4 border-t border-[#e5e2db]/60 space-y-4">
            <p className="text-xs text-[#717971] font-semibold">
              Don't have an account?{' '}
              <Link href="/signup" className="font-bold text-[#144227] hover:underline">
                Join the farm
              </Link>
            </p>
            
            {/* Elegant status indicator circle */}
            <div className="flex justify-center pt-2">
              <div className="w-10 h-10 rounded-full border-4 border-[#bceec8] flex items-center justify-center bg-[#bceec8]/20">
                <div className="w-3.5 h-3.5 rounded-full bg-[#144227]" />
              </div>
            </div>
          </div>
        </div>

        {/* Empty footer spacing for layout alignment */}
        <div />
      </div>
    </div>
  );
}

