"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Leaf, Eye, EyeOff } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [role, setRole] = useState('client'); // Default to client registration
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!agreeTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/accounts/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          role,
          full_name: fullName,
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

  const strength = getPasswordStrength();
  const strengthColors = ['bg-[#e5e2db]', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-emerald-500'];

  return (
    <div className="min-h-screen flex font-sans bg-[#fcf9f2]">
      {/* Left panel - Image Sidebar */}
      <div 
        className="hidden md:flex md:w-[45%] lg:w-[50%] relative bg-cover bg-center items-end p-12 lg:p-16 select-none"
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
      <div className="flex-1 flex flex-col justify-center px-6 py-8 sm:px-12 lg:px-20 xl:px-24 overflow-y-auto">
        <div className="mx-auto w-full max-w-md space-y-6 py-8">
          
          {/* Logo header */}
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-2 mb-2">
              <Leaf className="w-8 h-8 text-[#144227]" />
              <span className="text-[#144227] font-bold text-xl tracking-tight">Harvest Hill</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#1c1c18] tracking-tight">Create your account</h1>
            <p className="text-xs text-[#717971] mt-1">Start ordering fresh produce from local farms</p>
          </div>

          {/* Social signup */}
          <button 
            type="button"
            onClick={() => alert("Google authentication is placeholder in this view.")}
            className="w-full flex items-center justify-center gap-3 bg-white border border-[#c1c9c0] hover:bg-[#f6f3ec]/40 text-[#414942] px-4 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.478 0-6.3-2.823-6.3-6.3 0-3.478 2.822-6.3 6.3-6.3 1.554 0 2.977.566 4.077 1.503l3.057-3.056C19.123 2.167 15.89 1 12.24 1 6.033 1 12.24s5.033 11.24 11.24 11.24c5.898 0 10.873-4.223 10.873-11.24 0-.768-.08-1.5-.23-1.955H12.24z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Separator */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-[#e5e2db]"></div>
            <span className="flex-shrink mx-4 text-[10px] text-[#717971] font-bold uppercase tracking-wider">or sign up with email</span>
            <div className="flex-grow border-t border-[#e5e2db]"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="bg-[#ffdad6] text-[#93000a] text-xs font-bold p-3 rounded-xl border border-[#ba1a1a]/30">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-[#bceec8] text-[#00210f] text-xs font-bold p-3 rounded-xl border border-[#144227]/30">
                Account created successfully! Redirecting to login...
              </div>
            )}

            {/* Role selection tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#f0eee7] rounded-xl">
              <button
                type="button"
                onClick={() => setRole('client')}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  role === 'client' ? 'bg-[#144227] text-white' : 'text-[#414942] hover:text-[#144227]'
                }`}
              >
                Client / Chef
              </button>
              <button
                type="button"
                onClick={() => setRole('farmer')}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  role === 'farmer' ? 'bg-[#144227] text-white' : 'text-[#414942] hover:text-[#144227]'
                }`}
              >
                Farmer / Grower
              </button>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#1c1c18]">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-white border border-[#c1c9c0] focus:border-[#144227] rounded-xl px-4 py-2.5 text-xs focus:outline-none transition-all placeholder-[#717971]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#1c1c18]">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full bg-white border border-[#c1c9c0] focus:border-[#144227] rounded-xl px-4 py-2.5 text-xs focus:outline-none transition-all placeholder-[#717971]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#1c1c18]">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 000-0000"
                className="w-full bg-white border border-[#c1c9c0] focus:border-[#144227] rounded-xl px-4 py-2.5 text-xs focus:outline-none transition-all placeholder-[#717971]"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#1c1c18]">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-[#c1c9c0] focus:border-[#144227] rounded-xl pl-4 pr-11 py-2.5 text-xs focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#717971] hover:text-[#144227] cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              
              {/* Strength indicator */}
              <div className="flex gap-1 pt-1.5">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <div 
                    key={lvl} 
                    className={`h-1 flex-grow rounded transition-all ${
                      lvl <= strength ? strengthColors[strength] : 'bg-[#e5e2db]'
                    }`}
                  />
                ))}
              </div>
              <p className="text-[10px] text-[#717971] pt-1">
                Must be at least 8 characters with one special symbol.
              </p>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#1c1c18]">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-[#c1c9c0] focus:border-[#144227] rounded-xl px-4 py-2.5 text-xs focus:outline-none transition-all"
              />
            </div>

            {/* Agree Terms */}
            <label className="flex items-start gap-2.5 cursor-pointer group py-1.5">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={() => setAgreeTerms(!agreeTerms)}
                className="sr-only"
              />
              <div className={`w-4.5 h-4.5 rounded-md flex items-center justify-center border transition-all mt-0.5 ${
                agreeTerms
                  ? 'bg-[#144227] border-[#144227] text-white'
                  : 'border-[#c1c9c0] bg-white group-hover:border-[#144227]'
              }`}>
                {agreeTerms && (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-xs text-[#414942] font-semibold leading-snug">
                I agree to the <span className="font-bold text-[#144227] hover:underline">Terms of Service</span> and <span className="font-bold text-[#144227] hover:underline">Privacy Policy</span>.
              </span>
            </label>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || success}
              className="w-full bg-[#144227] text-white hover:bg-[#376847] disabled:opacity-50 py-3 rounded-full text-xs font-bold tracking-wider uppercase transition-colors shadow-md hover:shadow-lg cursor-pointer"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Login link */}
          <div className="text-center text-xs text-[#414942] font-medium pt-2">
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
