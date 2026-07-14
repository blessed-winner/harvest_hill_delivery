"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Eye, EyeOff, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function SetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  
  const uid = params?.uid as string;
  const token = params?.token as string;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Simple password strength calculation
  const getPasswordStrength = () => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (password.length >= 10) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength; // 0 to 5
  };

  const strength = getPasswordStrength();
  const strengthText = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong', 'Excellent'];
  const strengthColors = ['bg-[#e5e2db]', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-[#144227]'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Set password activates the account under the hood using the same reset confirm API endpoint
      const response = await fetch('http://localhost:8000/api/accounts/password-reset/confirm/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uidb64: uid,
          token: token,
          new_password: password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.errors ? Object.values(data.errors).flat().join(' ') : 'Failed to set password.';
        throw new Error(errorMsg);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-[#fcf9f2]">
      {/* Left panel - Image Sidebar */}
      <div 
        className="hidden md:flex md:w-[45%] lg:w-[50%] relative bg-cover bg-center items-between flex-col p-12 lg:p-16 select-none"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1500937386664-56d159062255?q=80&w=1000')` }}
      >
        {/* Darkening Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#144227]/95 via-[#144227]/40 to-[#144227]/20 z-10" />
        
        {/* Logo at Top Left */}
        <div className="relative z-20 flex items-center gap-2 text-white">
          <span className="font-bold text-2xl tracking-tight">Harvest Hill</span>
        </div>

        {/* Overlaid Text at Bottom Left */}
        <div className="relative z-20 text-white max-w-lg space-y-4 mt-auto">
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            You're approved — let's get your farm set up.
          </h2>
          <p className="text-white/80 text-sm lg:text-base font-medium leading-relaxed">
            Join our network of local growers bringing the season's finest harvest directly to the community's doorstep.
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
                <h1 className="text-3xl md:text-4xl font-extrabold text-[#144227] tracking-tight">Welcome to Harvest Hill</h1>
                <p className="text-xs text-[#717971] leading-relaxed">
                  Set a password to activate your account and access your farmer dashboard.
                </p>
              </>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#bceec8] text-[#00210f] flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-extrabold text-[#144227] tracking-tight">Account Activated!</h1>
                <p className="text-xs text-[#717971] leading-relaxed">
                  Your password has been set. Redirecting you to the login page to sign in...
                </p>
              </div>
            )}
          </div>

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-[#ffdad6] text-[#93000a] text-xs font-bold p-3 rounded-xl border border-[#ba1a1a]/30">
                  {error}
                </div>
              )}

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#1c1c18]">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full bg-white border border-[#c1c9c0] focus:border-[#144227] rounded-xl pl-4 pr-11 py-3 text-sm focus:outline-none transition-all placeholder-[#717971]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#717971] hover:text-[#144227] cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map((lvl) => (
                      <div 
                        key={lvl} 
                        className={`h-1.5 flex-grow rounded-full transition-all duration-300 ${
                          lvl <= strength ? strengthColors[strength] : 'bg-[#e5e2db]'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-[#717971] font-semibold">
                    <span>Enter a strong password</span>
                    {password && <span className="text-[#144227] font-bold">{strengthText[strength]}</span>}
                  </div>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#1c1c18]">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    className="w-full bg-white border border-[#c1c9c0] focus:border-[#144227] rounded-xl pl-4 pr-11 py-3 text-sm focus:outline-none transition-all placeholder-[#717971]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#717971] hover:text-[#144227] cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#144227] text-white hover:bg-[#224f33] disabled:opacity-50 py-3.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-colors shadow-md hover:shadow-lg cursor-pointer"
              >
                {loading ? 'Activating...' : 'Activate Account'}
              </button>
            </form>
          )}

          <div className="text-center pt-4 border-t border-[#e5e2db]/60 text-[11px] text-[#717971]">
            By activating, you agree to the <Link href="#" className="font-bold text-[#144227] hover:underline">Supplier Guidelines</Link>.
          </div>
        </div>

        <div />
      </div>
    </div>
  );
}
