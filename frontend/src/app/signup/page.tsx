"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [role, setRole] = useState('client');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }

    if (!/^[\w.@+-]+$/.test(username)) {
      setError("Username may only contain letters, numbers, and @/./+/-/_ characters.");
      return;
    }

    if (!agreeTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/accounts/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          role,
          full_name: fullName,
          username: username.toLowerCase().trim(),
          phone: phone
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.errors ? Object.values(data.errors).flat().join(' ') : 'Registration failed.';
        throw new Error(errorMsg);
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden flex font-sans bg-[#fcf9f2]">
      {/* Left panel - Image Sidebar */}
      <div 
        className="hidden md:flex md:w-[45%] lg:w-[50%] h-full relative bg-cover bg-center items-end p-12 lg:p-16 select-none"
        style={{ backgroundImage: `url('/signup_farm_bg.png')` }}
      >
        {/* Darkening Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#144227]/90 via-[#144227]/40 to-transparent z-10" />
        
        {/* Overlaid Text */}
        <div className="relative z-20 text-white max-w-lg space-y-4">
          <h2 className="text-4xl lg:text-5xl font-serif font-medium tracking-tight leading-tight">
            Join the harvest community
          </h2>
          <p className="text-white/80 text-sm lg:text-base font-medium">
            Direct connection to regional soil, seasonal abundance, and the farmers who nurture it all.
          </p>
        </div>
      </div>

      {/* Right panel - Form Content */}
      <div className="flex-1 h-full flex flex-col justify-center px-6 py-4 sm:px-12 lg:px-20 overflow-hidden">
        <div className="mx-auto w-full max-w-sm space-y-4 py-2">
          
          {/* Logo header */}
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[#144227] font-bold text-xl tracking-tight">Harvest Hill</span>
            </div>
            <h1 className="text-xl font-extrabold text-[#1c1c18] tracking-tight">Create your account</h1>
            <p className="text-[10px] text-[#717971]">Start ordering fresh produce from local farms</p>
          </div>

          {/* Social signup */}
          <button 
            type="button"
            onClick={() => alert("Google authentication is placeholder in this view.")}
            className="w-full flex items-center justify-center gap-2 bg-white border border-[#c1c9c0] hover:bg-[#f6f3ec]/40 text-[#414942] px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Continue with Google
          </button>

          {/* Separator */}
          <div className="relative flex py-0.5 items-center">
            <div className="flex-grow border-t border-[#e5e2db]"></div>
            <span className="flex-shrink mx-3 text-[9px] text-[#717971] font-bold uppercase tracking-wider">or sign up with email</span>
            <div className="flex-grow border-t border-[#e5e2db]"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-2.5">
            {error && (
              <div className="bg-[#ffdad6] text-[#93000a] text-[11px] font-bold p-2 rounded-lg border border-[#ba1a1a]/30">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-[#bceec8] text-[#00210f] text-[11px] font-bold p-2 rounded-lg border border-[#144227]/30">
                Account created successfully! Redirecting to login...
              </div>
            )}

            {/* Role selection tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-0.5 bg-[#f0eee7] rounded-lg">
              <button
                type="button"
                onClick={() => setRole('client')}
                className={`py-1.5 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                  role === 'client' ? 'bg-[#144227] text-white' : 'text-[#414942] hover:text-[#144227]'
                }`}
              >
                Client
              </button>
              <button
                type="button"
                onClick={() => setRole('farmer')}
                className={`py-1.5 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                  role === 'farmer' ? 'bg-[#144227] text-white' : 'text-[#414942] hover:text-[#144227]'
                }`}
              >
                Farmer
              </button>
            </div>

            <div className="space-y-0.5">
              <label className="block text-[10px] font-bold text-[#1c1c18]">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-white border border-[#c1c9c0] focus:border-[#144227] rounded-lg px-3 py-1.5 text-xs focus:outline-none transition-all placeholder-[#717971]"
              />
            </div>

            <div className="space-y-0.5">
              <label className="block text-[10px] font-bold text-[#1c1c18]">
                Username
                <span className="ml-1 text-[#717971] font-normal">(used to log in)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#717971] text-xs select-none">@</span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  placeholder="greenvalley"
                  minLength={3}
                  maxLength={30}
                  className="w-full bg-white border border-[#c1c9c0] focus:border-[#144227] rounded-lg pl-7 pr-3 py-1.5 text-xs focus:outline-none transition-all placeholder-[#717971]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-0.5">
                <label className="block text-[10px] font-bold text-[#1c1c18]">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full bg-white border border-[#c1c9c0] focus:border-[#144227] rounded-lg px-3 py-1.5 text-xs focus:outline-none transition-all placeholder-[#717971]"
                />
              </div>
              <div className="space-y-0.5">
                <label className="block text-[10px] font-bold text-[#1c1c18]">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 000-0000"
                  className="w-full bg-white border border-[#c1c9c0] focus:border-[#144227] rounded-lg px-3 py-1.5 text-xs focus:outline-none transition-all placeholder-[#717971]"
                />
              </div>
            </div>

            <div className="space-y-0.5">
              <label className="block text-[10px] font-bold text-[#1c1c18]">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-[#c1c9c0] focus:border-[#144227] rounded-lg pl-3 pr-9 py-1.5 text-xs focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#717971] hover:text-[#144227] cursor-pointer"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <p className="text-[10px] text-[#717971] pt-0.5">
                Must be at least 8 characters.
              </p>
            </div>

            <div className="space-y-0.5">
              <label className="block text-[10px] font-bold text-[#1c1c18]">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-[#c1c9c0] focus:border-[#144227] rounded-lg px-3 py-1.5 text-xs focus:outline-none transition-all"
              />
            </div>

            {/* Agree Terms */}
            <label className="flex items-start gap-2 cursor-pointer group py-0.5">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={() => setAgreeTerms(!agreeTerms)}
                className="sr-only"
              />
              <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all mt-0.5 ${
                agreeTerms
                  ? 'bg-[#144227] border-[#144227] text-white'
                  : 'border-[#c1c9c0] bg-white group-hover:border-[#144227]'
              }`}>
                {agreeTerms && (
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-[10px] text-[#414942] font-semibold leading-snug">
                I agree to the <span className="font-bold text-[#144227] hover:underline">Terms</span> and <span className="font-bold text-[#144227] hover:underline">Privacy</span>.
              </span>
            </label>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || success}
              className="w-full bg-[#144227] text-white hover:bg-[#376847] disabled:opacity-50 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase transition-colors shadow-sm cursor-pointer"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Login link */}
          <div className="text-center text-xs text-[#414942] font-medium">
            Already have an account?{' '}
            <Link 
              href="/login" 
              className="font-bold text-[#144227] hover:underline underline-offset-2"
            >
              Log in
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

