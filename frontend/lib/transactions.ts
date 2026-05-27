import { Transaction } from '@/types';

export function getTransactionLabel(tx: Transaction): string {
  if (tx.stripeSessionId) return 'Stripe Top-up';
  if (tx.type === 'DEBIT' && tx.otherParty) {
    return `Sent to ${tx.otherParty.name}`;
  }
  if (tx.type === 'CREDIT' && tx.otherParty) {
    return `Received from ${tx.otherParty.name}`;
  }
  if (tx.type === 'CREDIT') return 'Wallet Credit';
  if (tx.type === 'DEBIT') return 'Wallet Debit';
  return tx.description ?? 'Transaction';
}

export function getTransactionSubLabel(tx: Transaction): string | null {
  if (tx.stripeSessionId) return tx.description;
  if (tx.otherParty) return `ID: ${tx.otherParty.userId.slice(0, 8).toUpperCase()}`;
  return tx.description;
}
