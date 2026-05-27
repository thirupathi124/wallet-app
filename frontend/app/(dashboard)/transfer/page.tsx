'use client';

import { useEffect, useState } from 'react';
import { ArrowRightLeft, Mail, DollarSign, CheckCircle2, User } from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { getErrorMessage } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';

export default function TransferPage() {
  const { state: authState } = useAuth();
  const { state: walletState, fetchBalance, transfer } = useWallet();

  const [form, setForm] = useState({ receiverEmail: '', amount: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successData, setSuccessData] = useState<{ newBalance: number; message: string } | null>(null);

  useEffect(() => {
    fetchBalance().catch((err) => toast.error(getErrorMessage(err)));
  }, [fetchBalance]);

  const validate = () => {
    const e: Record<string, string> = {};
    const amt = parseFloat(form.amount);

    if (!form.receiverEmail) e.receiverEmail = 'Receiver email is required';
    else if (!/\S+@\S+\.\S+/.test(form.receiverEmail)) e.receiverEmail = 'Enter a valid email';
    else if (form.receiverEmail === authState.user?.email) e.receiverEmail = 'You cannot transfer to yourself';

    if (!form.amount) e.amount = 'Amount is required';
    else if (isNaN(amt) || amt <= 0) e.amount = 'Amount must be greater than zero';
    else if (walletState.balance !== null && amt > walletState.balance) {
      e.amount = `Insufficient balance (available: $${walletState.balance.toFixed(2)})`;
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleConfirm = () => {
    if (validate()) setConfirmOpen(true);
  };

  const handleTransfer = async () => {
    setConfirmOpen(false);
    setLoading(true);
    try {
      const result = await transfer(form.receiverEmail, parseFloat(form.amount));
      setSuccessData(result);
      setForm({ receiverEmail: '', amount: '' });
      toast.success(result.message);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transfer Money</h1>
        <p className="text-sm text-gray-500 mt-1">Send money to any registered user instantly</p>
      </div>

      {/* Balance pill */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-500">Available balance:</span>
        {walletState.isLoading ? (
          <Spinner size="sm" />
        ) : (
          <span className="font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full">
            ${walletState.balance?.toFixed(2) ?? '—'}
          </span>
        )}
      </div>

      {/* Success message */}
      {successData && (
        <Card className="border-emerald-200 bg-emerald-50" padding="md">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">{successData.message}</p>
              <p className="text-xs text-emerald-600 mt-0.5">
                New balance: <span className="font-bold">${successData.newBalance.toFixed(2)}</span>
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Transfer form */}
      <Card padding="lg">
        <div className="space-y-5">
          <Input
            label="Recipient email"
            type="email"
            placeholder="jane@example.com"
            value={form.receiverEmail}
            onChange={(e) => {
              setForm((f) => ({ ...f, receiverEmail: e.target.value }));
              setErrors((e) => ({ ...e, receiverEmail: '' }));
              setSuccessData(null);
            }}
            error={errors.receiverEmail}
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <Input
            label="Amount (USD)"
            type="number"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => {
              setForm((f) => ({ ...f, amount: e.target.value }));
              setErrors((e) => ({ ...e, amount: '' }));
              setSuccessData(null);
            }}
            error={errors.amount}
            leftIcon={<DollarSign className="w-4 h-4" />}
            min={0.01}
            step={0.01}
          />

          {/* Validation rules */}
          <ul className="text-xs text-gray-400 space-y-1 pl-1">
            <li className={form.receiverEmail && form.receiverEmail !== authState.user?.email ? 'text-emerald-500' : ''}>
              • Cannot transfer to yourself
            </li>
            <li className={form.amount && parseFloat(form.amount) > 0 ? 'text-emerald-500' : ''}>
              • Amount must be greater than $0
            </li>
            <li className={
              walletState.balance !== null && form.amount && parseFloat(form.amount) <= walletState.balance
                ? 'text-emerald-500' : ''
            }>
              • Cannot exceed your available balance
            </li>
          </ul>

          <Button
            fullWidth
            size="lg"
            onClick={handleConfirm}
            loading={loading}
            disabled={!form.receiverEmail || !form.amount}
          >
            <ArrowRightLeft className="w-5 h-5" />
            Transfer ${form.amount ? parseFloat(form.amount).toFixed(2) : '0.00'}
          </Button>
        </div>
      </Card>

      {/* Confirm dialog */}
      <Transition appear show={confirmOpen} as={Fragment}>
        <Dialog onClose={() => setConfirmOpen(false)} className="relative z-50">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
              leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 mx-auto mb-4">
                  <ArrowRightLeft className="w-7 h-7 text-indigo-600" />
                </div>
                <Dialog.Title className="text-center text-lg font-bold text-gray-900 mb-1">
                  Confirm Transfer
                </Dialog.Title>
                <p className="text-center text-sm text-gray-500 mb-5">
                  Please review the transfer details
                </p>

                <div className="bg-gray-50 rounded-xl p-4 space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-2">
                      <User className="w-4 h-4" /> To
                    </span>
                    <span className="font-semibold text-gray-900">{form.receiverEmail}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" /> Amount
                    </span>
                    <span className="font-bold text-indigo-700 text-base">
                      ${parseFloat(form.amount || '0').toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                    <span className="text-gray-500">Balance after</span>
                    <span className="font-semibold text-gray-700">
                      ${((walletState.balance ?? 0) - parseFloat(form.amount || '0')).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="secondary" fullWidth onClick={() => setConfirmOpen(false)}>
                    Cancel
                  </Button>
                  <Button fullWidth onClick={handleTransfer} loading={loading}>
                    Confirm
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
