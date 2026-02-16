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
  notification_id?: string | null;
  reminder_enabled?: boolean;
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
  notification_id?: string | null;
  reminder_enabled?: boolean;
}

export interface RecurringTransaction {
  id: string;
  name: string;
  amount: number;
  type: TransactionType;
  category_id: string;
  account_id: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  day_of_month?: number; // 1-31, only for monthly/yearly frequency
  next_date: string;
  is_active: boolean;
  notification_id?: string | null;
  reminder_enabled?: boolean;
  created_at: string;
}

export interface RecurringTransactionInput {
  name: string;
  amount: number;
  type: TransactionType;
  category_id: string;
  account_id: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  day_of_month?: number; // 1-31, only for monthly/yearly frequency
  next_date: string;
  notification_id?: string | null;
  reminder_enabled?: boolean;
}

export interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string; // ISO date
  monthly_target: number;
  created_at: string;
  is_active: boolean;
}

export interface GoalInput {
  name: string;
  target_amount: number;
  deadline: string;
}
