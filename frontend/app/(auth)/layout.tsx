'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { CircleDollarSign } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { state } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!state.isLoading && state.isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [state.isLoading, state.isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center justify-center p-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
          <CircleDollarSign className="w-6 h-6 text-white" />
        </div>
        <span className="text-2xl font-bold text-gray-900">WalletApp</span>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
