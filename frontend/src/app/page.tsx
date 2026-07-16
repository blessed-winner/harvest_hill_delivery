"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sprout, ArrowRight, CheckCircle, TrendingUp, Users, ShieldCheck } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('user_role');
    setIsLoggedIn(!!token);
    setUserRole(role);
  }, []);

  const handleGetStarted = () => {
    if (isLoggedIn && userRole) {
      // Redirect to appropriate dashboard
      switch (userRole) {
        case 'admin':
          router.push('/admin');
          break;
        case 'farmer':
          router.push('/farmer');
          break;
        case 'client':
          router.push('/client');
          break;
        default:
          router.push('/login');
      }
    } else {
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-surface-bright to-surface-container">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-outline-variant">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Sprout className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-primary">Harvest Hill</span>
            </div>
            
            <div className="flex items-center gap-4">
              {isLoggedIn ? (
                <button
                  onClick={handleGetStarted}
                  className="px-6 py-2 bg-primary text-white rounded-lg font-bold hover:opacity-90 transition-all"
                >
                  Go to Dashboard
                </button>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 text-primary font-medium hover:bg-surface-container rounded-lg transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/login"
                    className="px-6 py-2 bg-primary text-white rounded-lg font-bold hover:opacity-90 transition-all"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl sm:text-6xl font-extrabold text-primary mb-6 leading-tight">
                Farm-Fresh Produce, Direct to Your Kitchen
              </h1>
              <p className="text-xl text-on-surface-variant mb-8 leading-relaxed">
                Connecting high-end culinary professionals with artisanal local farms through 
                a transparent, efficient supply chain.
              </p>
              <button
                onClick={handleGetStarted}
                className="group flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-xl font-bold text-lg hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
              >
                Get Started Today
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sprout className="w-48 h-48 text-primary/30" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-primary mb-4">Why Choose Harvest Hill?</h2>
            <p className="text-xl text-on-surface-variant">
              Three roles, one seamless platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-surface-container-low rounded-2xl border border-outline-variant hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-primary mb-4">For Clients</h3>
              <p className="text-on-surface-variant leading-relaxed mb-4">
                Browse fresh, seasonal produce from verified local farms. Place orders with confidence 
                and track deliveries in real-time.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                  <span className="text-sm">Transparent pricing</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                  <span className="text-sm">Quality guaranteed</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                  <span className="text-sm">Next-day delivery</span>
                </li>
              </ul>
            </div>

            <div className="p-8 bg-surface-container-low rounded-2xl border border-outline-variant hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-secondary/10 rounded-xl flex items-center justify-center mb-6">
                <Sprout className="w-7 h-7 text-secondary" />
              </div>
              <h3 className="text-2xl font-bold text-secondary mb-4">For Farmers</h3>
              <p className="text-on-surface-variant leading-relaxed mb-4">
                List your harvests, negotiate fair prices, and reach premium buyers directly. 
                Get paid faster with transparent invoicing.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                  <span className="text-sm">Fair market pricing</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                  <span className="text-sm">Direct negotiations</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                  <span className="text-sm">Fast payments</span>
                </li>
              </ul>
            </div>

            <div className="p-8 bg-surface-container-low rounded-2xl border border-outline-variant hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-tertiary/10 rounded-xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-7 h-7 text-tertiary" />
              </div>
              <h3 className="text-2xl font-bold text-tertiary mb-4">Platform Admin</h3>
              <p className="text-on-surface-variant leading-relaxed mb-4">
                Oversee operations, manage users, and ensure quality standards across the entire 
                supply chain ecosystem.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                  <span className="text-sm">Complete oversight</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                  <span className="text-sm">Quality control</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                  <span className="text-sm">Analytics & reports</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="w-8 h-8" />
                <p className="text-5xl font-bold">$2.4M+</p>
              </div>
              <p className="text-on-primary-container text-lg">Total Transactions</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="w-8 h-8" />
                <p className="text-5xl font-bold">500+</p>
              </div>
              <p className="text-on-primary-container text-lg">Active Users</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sprout className="w-8 h-8" />
                <p className="text-5xl font-bold">150+</p>
              </div>
              <p className="text-on-primary-container text-lg">Partner Farms</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-primary mb-6">
            Ready to Transform Your Supply Chain?
          </h2>
          <p className="text-xl text-on-surface-variant mb-8">
            Join hundreds of farms and culinary professionals already using Harvest Hill
          </p>
          <button
            onClick={handleGetStarted}
            className="group inline-flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-xl font-bold text-lg hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
          >
            Start Your Journey
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-outline-variant py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <Sprout className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-primary">Harvest Hill</span>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Bridging the gap between artisanal local farms and high-end culinary professionals 
                through a transparent supply chain.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-3 text-sm">Product</h4>
              <ul className="space-y-2 text-sm text-on-surface-variant">
                <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-3 text-sm">Company</h4>
              <ul className="space-y-2 text-sm text-on-surface-variant">
                <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-outline-variant text-center">
            <p className="text-sm text-on-surface-variant">
              © 2024 Harvest Hill Supply Chain. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

