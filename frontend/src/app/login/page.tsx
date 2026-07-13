"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sprout, Eye, EyeOff, Tractor } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/accounts/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Extract errors from our standardized response shape
        const errorMsg = data.errors?.non_field_errors?.[0] || 
                         data.errors?.email?.[0] || 
                         data.errors?.password?.[0] || 
                         'Invalid email or password.';
        throw new Error(errorMsg);
      }

      // Save tokens
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('user_role', data.user.role);

      // Redirect depending on user role
      if (data.user.role === 'admin') {
        router.push('/admin');
      } else if (data.user.role === 'farmer') {
        router.push('/farmer');
      } else {
        router.push('/client');
      }
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
        className="hidden md:flex md:w-[45%] lg:w-[50%] relative bg-cover bg-center items-end p-12 lg:p-16 select-none"
        style={{ backgroundImage: `url('/login_farm_bg.png')` }}
      >
        {/* Darkening Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#144227]/90 via-[#144227]/40 to-transparent z-10" />
        
        {/* Overlaid Text */}
        <div className="relative z-20 text-white max-w-lg space-y-4">
          <h2 className="text-4xl lg:text-5xl font-serif font-medium tracking-tight leading-tight">
            Fresh from the farm to your table
          </h2>
          <p className="text-white/80 text-sm lg:text-base font-medium">
            Supporting local growers, nourishing local families.
          </p>
        </div>
      </div>

      {/* Right panel - Form Content */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-md space-y-8">
          
          {/* Logo header */}
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-2 mb-3">
              <Sprout className="w-8 h-8 text-[#144227]" />
              <span className="text-[#144227] font-bold text-xl tracking-tight">Harvest Hill</span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#1c1c18] tracking-tight">Welcome back</h1>
            <p className="text-xs text-[#717971] mt-1.5">Log in to continue to Harvest Hill</p>
          </div>

          {/* Social login */}
          <button 
            type="button"
            onClick={() => alert("Google authentication is placeholder in this view.")}
            className="w-full flex items-center justify-center gap-3 bg-white border border-[#c1c9c0] hover:bg-[#f6f3ec]/40 text-[#414942] px-4 py-3 rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.478 0-6.3-2.823-6.3-6.3 0-3.478 2.822-6.3 6.3-6.3 1.554 0 2.977.566 4.077 1.503l3.057-3.056C19.123 2.167 15.89 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c5.898 0 10.873-4.223 10.873-11.24 0-.768-.08-1.5-.23-1.955H12.24z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Separator */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-[#e5e2db]"></div>
            <span className="flex-shrink mx-4 text-[10px] text-[#717971] font-bold uppercase tracking-wider">or log in with email</span>
            <div className="flex-grow border-t border-[#e5e2db]"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
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
                placeholder="farmer@harvesthill.com"
                className="w-full bg-white border border-[#c1c9c0] focus:border-[#144227] rounded-xl px-4 py-3 text-sm focus:outline-none transition-all placeholder-[#717971]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#1c1c18]">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-[#c1c9c0] focus:border-[#144227] rounded-xl pl-4 pr-11 py-3 text-sm focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#717971] hover:text-[#144227] cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  className="sr-only"
                />
                <div className={`w-4.5 h-4.5 rounded-md flex items-center justify-center border transition-all ${
                  rememberMe
                    ? 'bg-[#144227] border-[#144227] text-white'
                    : 'border-[#c1c9c0] bg-white group-hover:border-[#144227]'
                }`}>
                  {rememberMe && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-xs text-[#414942] font-semibold">Remember me</span>
              </label>
              <Link 
                href="/forgot-password" 
                className="text-xs font-bold text-[#144227] hover:underline underline-offset-2"
              >
                Forgot password?
              </Link>
            </div>

            {/* Login button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#144227] text-white hover:bg-[#376847] disabled:opacity-50 py-3 rounded-full text-xs font-bold tracking-wider uppercase transition-colors shadow-md hover:shadow-lg cursor-pointer"
            >
              {loading ? 'Logging In...' : 'Log In'}
            </button>
          </form>

          {/* Signup link */}
          <div className="text-center text-xs text-[#414942] font-medium pt-2">
            Don't have an account?{' '}
            <Link 
              href="/signup" 
              className="font-bold text-[#144227] hover:underline underline-offset-2"
            >
              Sign up
            </Link>
          </div>

          {/* Supplier Application Link */}
          <div className="flex items-center justify-center gap-1.5 pt-4 border-t border-[#e5e2db] text-xs text-[#717971]">
            <Tractor size={16} />
            <span>Are you a farmer or supplier?</span>
            <Link 
              href="/apply" 
              className="font-bold text-[#144227] hover:underline underline-offset-2"
            >
              Apply here
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
