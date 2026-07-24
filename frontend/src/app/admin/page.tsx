"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../portals/admin/AdminLayout';

export default function AdminPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      const role = localStorage.getItem('user_role');
      if (!token || role !== 'admin') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_role');
        router.push('/');
      } else {
        setAuthorized(true);
      }
    }
  }, [router]);

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcf9f2]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#144227] border-t-transparent"></div>
      </div>
    );
  }

  return <AdminLayout />;
}
