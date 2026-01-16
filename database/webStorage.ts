import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, TransactionInput, Category, Account } from '../types';
import * as Crypto from 'expo-crypto';

// In-memory storage for web
let memoryStorage: {
    transactions: Transaction[];
    categories: Category[];
    accounts: Account[];
} = {
    transactions: [],
    categories: [],
    accounts: [],
};

const STORAGE_KEY = 'income_tracker_data';

function generateUUID(): string {
    return Crypto.randomUUID();
}

// Default categories
const defaultCategories: Category[] = [
    { id: 'cat-salary', name: 'Maaş', type: 'income', icon: 'briefcase', color: '#4CAF50' },
    { id: 'cat-freelance', name: 'Serbest', type: 'income', icon: 'laptop', color: '#8BC34A' },
    { id: 'cat-investment', name: 'Yatırım', type: 'income', icon: 'trending-up', color: '#00BCD4' },
    { id: 'cat-gift-in', name: 'Hediye', type: 'income', icon: 'gift', color: '#E91E63' },
    { id: 'cat-other-in', name: 'Diğer', type: 'income', icon: 'plus-circle', color: '#9E9E9E' },
    { id: 'cat-food', name: 'Yemek', type: 'expense', icon: 'restaurant', color: '#FF5722' },
    { id: 'cat-transport', name: 'Ulaşım', type: 'expense', icon: 'car', color: '#3F51B5' },
    { id: 'cat-shopping', name: 'Alışveriş', type: 'expense', icon: 'shopping-bag', color: '#9C27B0' },
    { id: 'cat-bills', name: 'Faturalar', type: 'expense', icon: 'file-text', color: '#F44336' },
    { id: 'cat-health', name: 'Sağlık', type: 'expense', icon: 'heart', color: '#E91E63' },
    { id: 'cat-entertainment', name: 'Eğlence', type: 'expense', icon: 'film', color: '#673AB7' },
    { id: 'cat-education', name: 'Eğitim', type: 'expense', icon: 'book', color: '#2196F3' },
    { id: 'cat-rent', name: 'Kira', type: 'expense', icon: 'home', color: '#795548' },
    { id: 'cat-subscription', name: 'Abonelik', type: 'expense', icon: 'refresh-cw', color: '#607D8B' },
    { id: 'cat-other-out', name: 'Diğer', type: 'expense', icon: 'more-horizontal', color: '#9E9E9E' },
];

const defaultAccounts: Account[] = [
    { id: 'default-cash', name: 'Nakit', balance: 0, currency: 'TRY' },
    { id: 'default-investment', name: 'Yatırım', balance: 0, currency: 'TRY' },
];

async function loadFromStorage(): Promise<void> {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        if (data) {
            memoryStorage = JSON.parse(data);
        } else {
            memoryStorage = {
                transactions: [],
                categories: [...defaultCategories],
                accounts: [...defaultAccounts],
            };
            await saveToStorage();
        }
    } catch (e) {
        console.error('Failed to load storage:', e);
        memoryStorage = {
            transactions: [],
            categories: [...defaultCategories],
            accounts: [...defaultAccounts],
        };
    }
}

async function saveToStorage(): Promise<void> {
    try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(memoryStorage));
    } catch (e) {
        console.error('Failed to save storage:', e);
    }
}

let initialized = false;

export async function initDatabase(): Promise<void> {
    if (initialized) return;
    await loadFromStorage();
    initialized = true;
}

export async function resetDatabase(): Promise<void> {
    memoryStorage = {
        transactions: [],
        categories: [...defaultCategories],
        accounts: [...defaultAccounts],
    };
    await saveToStorage();
}

// ============ TRANSACTIONS ============

export async function getAllTransactions(): Promise<Transaction[]> {
    await initDatabase();
    return [...memoryStorage.transactions].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );
}

export async function getTransactionsByDateRange(
    startDate: string,
    endDate: string
): Promise<Transaction[]> {
    await initDatabase();
    return memoryStorage.transactions.filter(t => {
        const date = t.date.split('T')[0];
        return date >= startDate && date <= endDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getTransactionsByMonth(
    year: number,
    month: number
): Promise<Transaction[]> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
    return getTransactionsByDateRange(startDate, endDate);
}

export async function addTransaction(input: TransactionInput): Promise<Transaction> {
    await initDatabase();
    const id = generateUUID();
    const created_at = new Date().toISOString();

    const transaction: Transaction = {
        id,
        type: input.type,
        amount: input.amount,
        category_id: input.category_id,
        account_id: input.account_id,
        description: input.description,
        date: input.date,
        is_recurring: input.is_recurring || false,
        recurring_id: input.recurring_id || null,
        calendar_event_id: null,
        synced: false,
        created_at,
    };

    memoryStorage.transactions.push(transaction);

    // Update account balance
    const account = memoryStorage.accounts.find(a => a.id === input.account_id);
    if (account) {
        account.balance += input.type === 'income' ? input.amount : -input.amount;
    }

    await saveToStorage();
    return transaction;
}

export async function updateTransaction(
    id: string,
    input: Partial<TransactionInput>
): Promise<void> {
    await initDatabase();
    const index = memoryStorage.transactions.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Transaction not found');

    const current = memoryStorage.transactions[index];

    // Reverse old balance
    const oldAccount = memoryStorage.accounts.find(a => a.id === current.account_id);
    if (oldAccount) {
        oldAccount.balance += current.type === 'income' ? -current.amount : current.amount;
    }

    // Update transaction
    memoryStorage.transactions[index] = { ...current, ...input, synced: false };

    // Apply new balance
    const newTx = memoryStorage.transactions[index];
    const newAccount = memoryStorage.accounts.find(a => a.id === newTx.account_id);
    if (newAccount) {
        newAccount.balance += newTx.type === 'income' ? newTx.amount : -newTx.amount;
    }

    await saveToStorage();
}

export async function deleteTransaction(id: string): Promise<void> {
    await initDatabase();
    const index = memoryStorage.transactions.findIndex(t => t.id === id);
    if (index === -1) return;

    const transaction = memoryStorage.transactions[index];

    // Reverse balance
    const account = memoryStorage.accounts.find(a => a.id === transaction.account_id);
    if (account) {
        account.balance += transaction.type === 'income' ? -transaction.amount : transaction.amount;
    }

    memoryStorage.transactions.splice(index, 1);
    await saveToStorage();
}

// ============ CATEGORIES ============

export async function getAllCategories(): Promise<Category[]> {
    await initDatabase();
    return [...memoryStorage.categories];
}

export async function getCategoriesByType(type: 'income' | 'expense'): Promise<Category[]> {
    await initDatabase();
    return memoryStorage.categories.filter(c => c.type === type);
}

export async function addCategory(category: Omit<Category, 'id'>): Promise<Category> {
    await initDatabase();
    const newCategory: Category = { id: generateUUID(), ...category };
    memoryStorage.categories.push(newCategory);
    await saveToStorage();
    return newCategory;
}

// ============ ACCOUNTS ============

export async function getAllAccounts(): Promise<Account[]> {
    await initDatabase();
    return [...memoryStorage.accounts];
}

export async function addAccount(account: Omit<Account, 'id'>): Promise<Account> {
    await initDatabase();
    const newAccount: Account = { id: generateUUID(), ...account };
    memoryStorage.accounts.push(newAccount);
    await saveToStorage();
    return newAccount;
}

export async function updateAccountBalance(id: string, balance: number): Promise<void> {
    await initDatabase();
    const account = memoryStorage.accounts.find(a => a.id === id);
    if (account) {
        account.balance = balance;
        await saveToStorage();
    }
}

export async function deleteAccount(id: string): Promise<void> {
    await initDatabase();
    memoryStorage.accounts = memoryStorage.accounts.filter(a => a.id !== id);
    await saveToStorage();
}

// ============ STATISTICS ============

export async function getMonthlyStats(year: number, month: number): Promise<{
    totalIncome: number;
    totalExpense: number;
    balance: number;
    byCategory: { category_id: string; total: number; type: string }[];
}> {
    const transactions = await getTransactionsByMonth(year, month);

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryTotals: Record<string, { total: number; type: string }> = {};

    for (const t of transactions) {
        if (t.type === 'income') {
            totalIncome += t.amount;
        } else {
            totalExpense += t.amount;
        }

        if (!categoryTotals[t.category_id]) {
            categoryTotals[t.category_id] = { total: 0, type: t.type };
        }
        categoryTotals[t.category_id].total += t.amount;
    }

    const byCategory = Object.entries(categoryTotals).map(([category_id, data]) => ({
        category_id,
        ...data,
    }));

    return {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        byCategory,
    };
}

// Export getDatabase as no-op for compatibility
export async function getDatabase(): Promise<null> {
    return null;
}
