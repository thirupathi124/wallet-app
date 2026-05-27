'use client';

import { useEffect, useState } from 'react';
import {
  History,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import toast from 'react-hot-toast';
import { useWallet } from '@/context/WalletContext';
import { getErrorMessage } from '@/lib/api';
import { getTransactionLabel, getTransactionSubLabel } from '@/lib/transactions';
import { Transaction } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

type FilterType = 'ALL' | 'CREDIT' | 'DEBIT';

const STATUS_COLORS: Record<string, string> = {
  SUCCESS: 'bg-emerald-50 text-emerald-700',
  PENDING: 'bg-amber-50 text-amber-700',
  FAILED: 'bg-red-50 text-red-700',
};

function TransactionRow({ tx }: { tx: Transaction }) {
  const isCredit = tx.type === 'CREDIT';
  const label = getTransactionLabel(tx);
  const subLabel = getTransactionSubLabel(tx);

  return (
    <div className="flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition-colors rounded-xl">
      {/* Icon */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
        isCredit ? 'bg-emerald-50' : 'bg-red-50'
      }`}>
        {isCredit
          ? <TrendingUp className="w-5 h-5 text-emerald-600" />
          : <TrendingDown className="w-5 h-5 text-red-500" />}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-900 truncate">{label}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[tx.status]}`}>
            {tx.status}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            isCredit ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}>
            {isCredit ? 'Credit' : 'Debit'}
          </span>
        </div>
        {subLabel && (
          <p className="text-xs text-gray-400 truncate mt-0.5">{subLabel}</p>
        )}
        <p className="text-xs text-gray-400 mt-0.5">
          {new Date(tx.createdAt).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>

      {/* Amount */}
      <div className="text-right flex-shrink-0">
        <p className={`text-base font-bold ${isCredit ? 'text-emerald-600' : 'text-red-500'}`}>
          {isCredit ? '+' : '-'}${tx.amount.toFixed(2)}
        </p>
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  const { state, fetchTransactions } = useWallet();
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTransactions().catch((err) => toast.error(getErrorMessage(err)));
  }, [fetchTransactions]);

  const handleRefresh = async () => {
    try {
      await fetchTransactions();
      toast.success('Refreshed');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const filtered = state.transactions.filter((tx) => {
    const matchesFilter = filter === 'ALL' || tx.type === filter;
    const term = search.toLowerCase();
    const matchesSearch =
      !term ||
      tx.otherParty?.name.toLowerCase().includes(term) ||
      tx.otherParty?.userId.toLowerCase().includes(term) ||
      tx.description?.toLowerCase().includes(term) ||
      tx.amount.toString().includes(term);
    return matchesFilter && matchesSearch;
  });

  const totalCredits = state.transactions
    .filter((t) => t.type === 'CREDIT' && t.status === 'SUCCESS')
    .reduce((s, t) => s + t.amount, 0);
  const totalDebits = state.transactions
    .filter((t) => t.type === 'DEBIT' && t.status === 'SUCCESS')
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
          <p className="text-sm text-gray-500 mt-0.5">{state.transactions.length} total transactions</p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleRefresh}>
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Received</p>
              <p className="text-xl font-bold text-emerald-600">${totalCredits.toFixed(2)}</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Sent</p>
              <p className="text-xl font-bold text-red-500">${totalDebits.toFixed(2)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or amount..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          />
        </div>

        {/* Filter dropdown */}
        <Menu as="div" className="relative">
          <Menu.Button as={Button} variant="secondary" size="md">
            <Filter className="w-4 h-4" />
            {filter === 'ALL' ? 'All' : filter}
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 mt-2 w-40 bg-white border border-gray-100 rounded-xl shadow-lg z-10 overflow-hidden">
              {(['ALL', 'CREDIT', 'DEBIT'] as FilterType[]).map((f) => (
                <Menu.Item key={f}>
                  {({ active }) => (
                    <button
                      onClick={() => setFilter(f)}
                      className={`w-full text-left px-4 py-2.5 text-sm ${
                        active ? 'bg-gray-50' : ''
                      } ${filter === f ? 'text-indigo-600 font-semibold' : 'text-gray-700'}`}
                    >
                      {f === 'ALL' ? 'All transactions' : f === 'CREDIT' ? 'Credits only' : 'Debits only'}
                    </button>
                  )}
                </Menu.Item>
              ))}
            </Menu.Items>
          </Transition>
        </Menu>
      </div>

      {/* Transactions list */}
      <Card padding="sm">
        {state.transactionsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <History className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">
              {search || filter !== 'ALL' ? 'No matching transactions' : 'No transactions yet'}
            </p>
            {!search && filter === 'ALL' && (
              <p className="text-xs mt-1">Add money or make a transfer to get started</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
