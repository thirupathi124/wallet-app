'use client';

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
} from 'react';
import { WalletState, WalletAction, Transaction } from '@/types';
import { walletApi, transactionsApi } from '@/lib/api';

// ─── Reducer ──────────────────────────────────────────────────────────────────

const initialState: WalletState = {
  balance: null,
  walletId: null,
  transactions: [],
  isLoading: false,
  transactionsLoading: false,
};

function walletReducer(state: WalletState, action: WalletAction): WalletState {
  switch (action.type) {
    case 'SET_BALANCE':
      return {
        ...state,
        balance: action.payload.balance,
        walletId: action.payload.walletId,
        isLoading: false,
      };
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload, transactionsLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_TX_LOADING':
      return { ...state, transactionsLoading: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface WalletContextValue {
  state: WalletState;
  fetchBalance: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  addMoney: (amount: number) => Promise<{ sessionUrl: string; sessionId: string }>;
  transfer: (receiverEmail: string, amount: number) => Promise<{ newBalance: number; message: string }>;
  resetWallet: () => void;
}

const WalletContext = createContext<WalletContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(walletReducer, initialState);

  const fetchBalance = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const data = await walletApi.getBalance();
    dispatch({ type: 'SET_BALANCE', payload: { balance: data.balance, walletId: data.walletId } });
  }, []);

  const fetchTransactions = useCallback(async () => {
    dispatch({ type: 'SET_TX_LOADING', payload: true });
    const data: Transaction[] = await transactionsApi.getHistory();
    dispatch({ type: 'SET_TRANSACTIONS', payload: data });
  }, []);

  const addMoney = useCallback(async (amount: number) => {
    const data = await walletApi.addMoney(amount);
    return data as { sessionUrl: string; sessionId: string };
  }, []);

  const transfer = useCallback(async (receiverEmail: string, amount: number) => {
    const data = await transactionsApi.transfer({ receiverEmail, amount });
    dispatch({ type: 'SET_BALANCE', payload: { balance: data.newBalance, walletId: state.walletId! } });
    return data as { newBalance: number; message: string };
  }, [state.walletId]);

  const resetWallet = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return (
    <WalletContext.Provider value={{ state, fetchBalance, fetchTransactions, addMoney, transfer, resetWallet }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
