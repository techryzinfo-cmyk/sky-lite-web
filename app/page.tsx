'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
      <div className="text-center">
        <h1 className="text-4xl font-black tracking-tight text-white mb-6">
          SKY<span className="text-blue-500">LITE</span>
        </h1>
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
      </div>
    </div>
  );
}
