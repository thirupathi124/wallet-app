'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Wallet,
  ArrowRightLeft,
  History,
  LogOut,
  CircleDollarSign,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import toast from 'react-hot-toast';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/wallet', label: 'Add Money', icon: Wallet },
  { href: '/transfer', label: 'Transfer', icon: ArrowRightLeft },
  { href: '/transactions', label: 'History', icon: History },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { state, logout } = useAuth();
  const { resetWallet } = useWallet();

  const handleLogout = async () => {
    await logout();
    resetWallet();
    toast.success('Logged out successfully');
    router.replace('/login');
  };

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-100 flex flex-col z-10">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
          <CircleDollarSign className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-bold text-gray-900">WalletApp</span>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-gray-50">
          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-indigo-700">
              {state.user?.name?.charAt(0)?.toUpperCase() ?? '?'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{state.user?.name ?? 'User'}</p>
            <p className="text-xs text-gray-500 truncate font-mono">
              ID: {state.user?.id ? state.user.id.slice(0, 8).toUpperCase() : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                ${active
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-indigo-600' : 'text-gray-400'}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-4 py-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
