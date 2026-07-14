"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sprout, Eye, EyeOff, Tractor } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
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
        body: JSON.stringify({ username_or_email: identifier, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Extract errors from our standardized response shape
        const errorMsg = data.errors?.non_field_errors?.[0] ||
                         data.errors?.username_or_email?.[0] ||
                         data.errors?.email?.[0] ||
                         'Invalid credentials.';
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
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Continue with Google
          </button>

          {/* Separator */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-[#e5e2db]"></div>
            <span className="flex-shrink mx-4 text-[10px] text-[#717971] font-bold uppercase tracking-wider">or log in with email / username</span>
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
              <label className="block text-xs font-bold text-[#1c1c18]">Email or Username</label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="farmer@harvesthill.com or greenvalley"
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
