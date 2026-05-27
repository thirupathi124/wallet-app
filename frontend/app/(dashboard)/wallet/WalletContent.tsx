'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Wallet,
  CreditCard,
  CheckCircle2,
  XCircle,
  DollarSign,
  ExternalLink,
  Mail,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useWallet } from '@/context/WalletContext';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';

const PRESET_AMOUNTS = [10, 25, 50, 100, 250, 500];

export default function WalletContent() {
  const searchParams = useSearchParams();
  const { state, fetchBalance, addMoney } = useWallet();
  const { state: authState } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState('');
  const [loading, setLoading] = useState(false);

  const paymentStatus = mounted ? searchParams.get('payment') : null;
  const userEmail = mounted ? (authState.user?.email ?? '') : '';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchBalance().catch((err) => toast.error(getErrorMessage(err)));
  }, [fetchBalance]);

  useEffect(() => {
    if (!mounted) return;

    if (paymentStatus === 'success') {
      toast.success('Payment successful! Your wallet will be credited shortly.');
      fetchBalance().catch(() => {});
    } else if (paymentStatus === 'cancelled') {
      toast.error('Payment cancelled.');
    }
  }, [paymentStatus, fetchBalance, mounted]);

  const validate = () => {
    const num = parseFloat(amount);
    if (!amount) { setAmountError('Amount is required'); return false; }
    if (isNaN(num) || num < 1) { setAmountError('Minimum amount is $1'); return false; }
    if (num > 10000) { setAmountError('Maximum amount is $10,000'); return false; }
    setAmountError('');
    return true;
  };

  const handleAddMoney = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { sessionUrl } = await addMoney(parseFloat(amount));
      window.location.href = sessionUrl;
    } catch (err) {
      toast.error(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add Money</h1>
        <p className="text-sm text-gray-500 mt-1">Top up your wallet securely via Stripe</p>
      </div>

      {paymentStatus === 'success' && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-800">Payment successful!</p>
            <p className="text-xs text-emerald-600">Your balance will be updated once Stripe confirms the payment.</p>
          </div>
        </div>
      )}
      {paymentStatus === 'cancelled' && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">Payment was cancelled. No charge was made.</p>
        </div>
      )}

      <Card className="bg-gradient-to-r from-indigo-600 to-indigo-700 border-0 text-white" padding="lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-indigo-200 text-sm">Current Balance</p>
            {state.isLoading ? (
              <Spinner size="sm" />
            ) : (
              <p className="text-4xl font-bold mt-1">${state.balance?.toFixed(2) ?? '—'}</p>
            )}
          </div>
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
            <Wallet className="w-8 h-8 text-white" />
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Select amount</h2>

        <div className="grid grid-cols-3 gap-2 mb-5">
          {PRESET_AMOUNTS.map((preset) => (
            <button
              key={preset}
              onClick={() => { setAmount(preset.toString()); setAmountError(''); }}
              className={`
                py-2.5 rounded-xl text-sm font-semibold border transition-all
                ${amount === preset.toString()
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-400 hover:text-indigo-600'
                }
              `}
            >
              ${preset}
            </button>
          ))}
        </div>

        <div className="relative mb-4">
          <Input
            label="Receipt email"
            type="text"
            value={userEmail ? userEmail.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(b.length) + c) : ''}
            readOnly
            disabled
            placeholder="Loading..."
            leftIcon={<Mail className="w-4 h-4" />}
          />
        </div>

        <div className="relative mb-6">
          <div className="flex items-center gap-1 mb-1">
            <label className="text-sm font-medium text-gray-700">Or enter custom amount</label>
          </div>
          <Input
            type="number"
            placeholder="Enter amount in USD"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setAmountError(''); }}
            error={amountError}
            leftIcon={<DollarSign className="w-4 h-4" />}
            min={1}
            step={0.01}
          />
        </div>

        <Button
          fullWidth
          size="lg"
          onClick={handleAddMoney}
          loading={loading}
          disabled={!amount}
        >
          <CreditCard className="w-5 h-5" />
          Pay ${amount ? parseFloat(amount).toFixed(2) : '0.00'} with Stripe
          <ExternalLink className="w-4 h-4 opacity-60" />
        </Button>

        <p className="text-center text-xs text-gray-400 mt-3">
          You&apos;ll be redirected to Stripe&apos;s secure payment page. We never store your card details.
        </p>
      </Card>

      <Card padding="md" className="bg-blue-50 border-blue-100">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-900">Test card numbers (Stripe test mode)</p>
            <p className="text-xs text-blue-700 mt-1">
              Use <code className="bg-blue-100 px-1 rounded">4242 4242 4242 4242</code> with any future date and any CVC.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
