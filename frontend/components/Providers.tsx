'use client';

import { ReactNode, useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import { WalletProvider } from '@/context/WalletContext';

export default function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <AuthProvider>
      <WalletProvider>
        {children}
        {mounted && (
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { borderRadius: '10px', fontSize: '14px' },
              success: { iconTheme: { primary: '#4f46e5', secondary: '#fff' } },
            }}
          />
        )}
      </WalletProvider>
    </AuthProvider>
  );
}
