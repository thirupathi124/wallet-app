export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export type AuthAction =
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; accessToken: string; refreshToken: string } }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'REFRESH_TOKEN'; payload: { accessToken: string; refreshToken: string } };

export interface WalletState {
  balance: number | null;
  walletId: string | null;
  transactions: Transaction[];
  isLoading: boolean;
  transactionsLoading: boolean;
}

export type WalletAction =
  | { type: 'SET_BALANCE'; payload: { balance: number; walletId: string } }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_TX_LOADING'; payload: boolean }
  | { type: 'RESET' };

export interface Transaction {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  description: string | null;
  stripeSessionId: string | null;
  otherParty: { name: string; userId: string } | null;
  createdAt: string;
}

export interface ApiError {
  message: string | string[];
  statusCode: number;
}
