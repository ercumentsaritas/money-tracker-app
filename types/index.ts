// Transaction and category types for the income tracker app

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category_id: string;
  account_id: string;
  description: string;
  date: string; // ISO format
  is_recurring: boolean;
  recurring_id: string | null;
  calendar_event_id: string | null;
  synced: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  currency: string;
}

export interface RecurringTemplate {
  id: string;
  transaction_base: {
    type: TransactionType;
    amount: number;
    category_id: string;
    account_id: string;
    description: string;
  };
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  next_date: string;
  end_date: string | null;
}

export interface TransactionInput {
  type: TransactionType;
  amount: number;
  category_id: string;
  account_id: string;
  description: string;
  date: string;
  is_recurring?: boolean;
  recurring_id?: string | null;
}
