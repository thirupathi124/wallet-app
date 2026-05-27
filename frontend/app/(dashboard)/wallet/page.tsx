'use client';

import { Suspense } from 'react';
import Spinner from '@/components/ui/Spinner';
import WalletContent from './WalletContent';

export default function WalletPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[40vh]">
          <Spinner size="lg" />
        </div>
      }
    >
      <WalletContent />
    </Suspense>
  );
}
