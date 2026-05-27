'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import {
  Wallet,
  ArrowRightLeft,
  History,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ArrowUpRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { getErrorMessage } from '@/lib/api';
import { getTransactionLabel, getTransactionSubLabel } from '@/lib/transactions';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

const quickActions = [
  { href: '/wallet', label: 'Add Money', icon: Wallet, color: 'bg-indigo-50 text-indigo-600', desc: 'Top up via Stripe' },
  { href: '/transfer', label: 'Transfer', icon: ArrowRightLeft, color: 'bg-emerald-50 text-emerald-600', desc: 'Send to a user' },
  { href: '/transactions', label: 'History', icon: History, color: 'bg-amber-50 text-amber-600', desc: 'View all activity' },
];

export default function DashboardPage() {
  const { state: authState } = useAuth();
  const { state: walletState, fetchBalance, fetchTransactions } = useWallet();

  useEffect(() => {
    const load = async () => {
      try {
        await Promise.all([fetchBalance(), fetchTransactions()]);
      } catch (err) {
        toast.error(getErrorMessage(err));
      }
    };
    load();
  }, [fetchBalance, fetchTransactions]);

  const recentTx = walletState.transactions.slice(0, 5);
  const totalCredits = walletState.transactions
    .filter((t) => t.type === 'CREDIT' && t.status === 'SUCCESS')
    .reduce((s, t) => s + t.amount, 0);
  const totalDebits = walletState.transactions
    .filter((t) => t.type === 'DEBIT' && t.status === 'SUCCESS')
    .reduce((s, t) => s + t.amount, 0);

  const handleRefresh = async () => {
    try {
      await Promise.all([fetchBalance(), fetchTransactions()]);
      toast.success('Refreshed');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good evening, {authState.user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Here&apos;s your wallet overview</p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleRefresh}>
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Balance + Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Main balance card */}
        <Card className="md:col-span-2 bg-gradient-to-br from-indigo-600 to-indigo-800 border-0 text-white" padding="lg">
          <p className="text-indigo-200 text-sm font-medium">Total Balance</p>
          {walletState.isLoading ? (
            <div className="mt-3"><Spinner size="md" /></div>
          ) : (
            <p className="text-5xl font-bold mt-2 tracking-tight">
              ${walletState.balance?.toFixed(2) ?? '—'}
            </p>
          )}
          <p className="text-indigo-300 text-xs mt-3">Wallet ID: {walletState.walletId?.slice(0, 8)}...</p>
        </Card>

        {/* Stats */}
        <div className="space-y-4">
          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Total Received</p>
                <p className="text-xl font-bold text-emerald-600 mt-0.5">${totalCredits.toFixed(2)}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </Card>
          <Card padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">Total Sent</p>
                <p className="text-xl font-bold text-red-500 mt-0.5">${totalDebits.toFixed(2)}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-500" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {quickActions.map(({ href, label, icon: Icon, color, desc }) => (
            <Link key={href} href={href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer group" padding="md">
                <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-3`}>
                  <Icon className="w-6 h-6" />
                </div>
                <p className="font-semibold text-gray-900 text-sm group-hover:text-indigo-600 transition-colors">
                  {label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent transactions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Recent Activity
          </h2>
          <Link href="/transactions" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
            View all <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        <Card padding="sm">
          {walletState.transactionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : recentTx.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No transactions yet</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {recentTx.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between px-3 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      tx.type === 'CREDIT' ? 'bg-emerald-50' : 'bg-red-50'
                    }`}>
                      {tx.type === 'CREDIT'
                        ? <TrendingUp className="w-4 h-4 text-emerald-600" />
                        : <TrendingDown className="w-4 h-4 text-red-500" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {getTransactionLabel(tx)}
                      </p>
                      {getTransactionSubLabel(tx) && (
                        <p className="text-xs text-gray-400 truncate">
                          {getTransactionSubLabel(tx)}
                        </p>
                      )}
                      <p className="text-xs text-gray-400">
                        {new Date(tx.createdAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${
                    tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-red-500'
                  }`}>
                    {tx.type === 'CREDIT' ? '+' : '-'}${tx.amount.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
