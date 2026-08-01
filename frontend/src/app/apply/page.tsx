"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ApplyPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/signup');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#fcf9f2] flex items-center justify-center p-4">
      <div className="text-center space-y-2">
        <p className="text-xs font-bold text-[#144227]">Redirecting to Signup Page...</p>
      </div>
    </div>
  );
}
