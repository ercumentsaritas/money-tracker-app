import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, TransactionInput, Category, Account, RecurringTransaction, RecurringTransactionInput, Goal, GoalInput } from '../types';
import * as Crypto from 'expo-crypto';
import { NotificationService } from '../services/notificationService';

// In-memory storage for web
let memoryStorage: {
    transactions: Transaction[];
    categories: Category[];
    accounts: Account[];
    recurringTransactions: RecurringTransaction[];
    goals: Goal[];
} = {
    transactions: [],
    categories: [],
    accounts: [],
    recurringTransactions: [],
    goals: [],
};

const STORAGE_KEY = 'income_tracker_data';

function generateUUID(): string {
    return Crypto.randomUUID();
}

// Helper function for accurate month calculation
function getMonthsDiff(startDate: Date, endDate: Date): number {
    const yearDiff = endDate.getFullYear() - startDate.getFullYear();
    const monthDiff = endDate.getMonth() - startDate.getMonth();
    return Math.max(1, yearDiff * 12 + monthDiff);
}

// Helper function to update account balance
function updateAccountBalanceHelper(accountId: string, amount: number, type: 'income' | 'expense'): void {
    const account = memoryStorage.accounts.find(a => a.id === accountId);
    if (account) {
        account.balance += type === 'income' ? amount : -amount;
    }
}

// Default categories
const defaultCategories: Category[] = [
    { id: 'cat-salary', name: 'Maaş', type: 'income', icon: 'briefcase', color: '#4CAF50' },
    { id: 'cat-freelance', name: 'Serbest', type: 'income', icon: 'laptop', color: '#8BC34A' },
    { id: 'cat-investment', name: 'Yatırım', type: 'income', icon: 'trending-up', color: '#00BCD4' },
    { id: 'cat-gift-in', name: 'Hediye', type: 'income', icon: 'gift', color: '#E91E63' },
    { id: 'cat-other-in', name: 'Diğer', type: 'income', icon: 'add-circle', color: '#9E9E9E' },
    { id: 'cat-food', name: 'Yemek', type: 'expense', icon: 'restaurant', color: '#FF5722' },
    { id: 'cat-transport', name: 'Ulaşım', type: 'expense', icon: 'car', color: '#3F51B5' },
    { id: 'cat-shopping', name: 'Alışveriş', type: 'expense', icon: 'cart', color: '#9C27B0' },
    { id: 'cat-bills', name: 'Faturalar', type: 'expense', icon: 'document-text', color: '#F44336' },
    { id: 'cat-health', name: 'Sağlık', type: 'expense', icon: 'heart', color: '#E91E63' },
    { id: 'cat-entertainment', name: 'Eğlence', type: 'expense', icon: 'film', color: '#673AB7' },
    { id: 'cat-education', name: 'Eğitim', type: 'expense', icon: 'book', color: '#2196F3' },
    { id: 'cat-rent', name: 'Kira', type: 'expense', icon: 'home', color: '#795548' },
    { id: 'cat-subscription', name: 'Abonelik', type: 'expense', icon: 'refresh', color: '#607D8B' },
    { id: 'cat-other-out', name: 'Diğer', type: 'expense', icon: 'ellipsis-horizontal', color: '#9E9E9E' },
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
                recurringTransactions: [],
                goals: [],
            };
            await saveToStorage();
        }
    } catch (e) {
        console.error('Failed to load storage:', e);
        memoryStorage = {
            transactions: [],
            categories: [...defaultCategories],
            accounts: [...defaultAccounts],
            recurringTransactions: [],
            goals: [],
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
    // Reset in-memory storage
    memoryStorage = {
        transactions: [],
        categories: [...defaultCategories],
        accounts: [...defaultAccounts],
        recurringTransactions: [],
        goals: [],
    };

    // Save to AsyncStorage
    await saveToStorage();

    // Reset initialized flag so next initDatabase call will reload fresh data
    initialized = false;
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
    const startTime = new Date(startDate).getTime();
    const endTime = new Date(endDate + 'T23:59:59').getTime();

    return memoryStorage.transactions.filter(t => {
        const txTime = new Date(t.date).getTime();
        return txTime >= startTime && txTime <= endTime;
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
        notification_id: null,
        reminder_enabled: input.reminder_enabled || false,
    };

    if (input.reminder_enabled) {
        const notifId = await NotificationService.scheduleTransactionReminder(transaction);
        if (notifId) {
            transaction.notification_id = notifId;
        }
    }

    memoryStorage.transactions.push(transaction);

    // Only update balance if transaction date is today or in the past
    // Parse the date string properly to avoid timezone issues
    const [year, month, day] = input.date.split('-').map(Number);
    const transactionDate = new Date(year, month - 1, day); // Local midnight
    transactionDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    if (transactionDate <= today) {
        updateAccountBalanceHelper(input.account_id, input.amount, input.type);
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
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Parse old date properly to avoid timezone issues
    const [oldYear, oldMonth, oldDay] = current.date.split('-').map(Number);
    const oldDate = new Date(oldYear, oldMonth - 1, oldDay);
    oldDate.setHours(0, 0, 0, 0);
    const oldWasPastOrToday = oldDate <= today;

    // Reverse old balance if it was past or today
    if (oldWasPastOrToday) {
        updateAccountBalanceHelper(current.account_id, -current.amount, current.type);
    }

    // Update transaction
    memoryStorage.transactions[index] = { ...current, ...input, synced: false };

    // Apply new balance if new date is past or today
    const newTx = memoryStorage.transactions[index];
    const [newYear, newMonth, newDay] = newTx.date.split('-').map(Number);
    const newDate = new Date(newYear, newMonth - 1, newDay);
    newDate.setHours(0, 0, 0, 0);
    const newIsPastOrToday = newDate <= today;

    if (newIsPastOrToday) {
        updateAccountBalanceHelper(newTx.account_id, newTx.amount, newTx.type);
    }

    await saveToStorage();
}

export async function deleteTransaction(id: string): Promise<void> {
    await initDatabase();
    const index = memoryStorage.transactions.findIndex(t => t.id === id);
    if (index === -1) return;

    const transaction = memoryStorage.transactions[index];

    // Only reverse balance if transaction date is today or in the past
    // Parse the date string properly to avoid timezone issues
    const [year, month, day] = transaction.date.split('-').map(Number);
    const transactionDate = new Date(year, month - 1, day);
    transactionDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (transactionDate <= today) {
        updateAccountBalanceHelper(transaction.account_id, -transaction.amount, transaction.type);
    }

    if (transaction.notification_id) {
        await NotificationService.cancelNotification(transaction.notification_id);
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

export async function updateAccount(id: string, updates: Partial<Omit<Account, 'id'>>): Promise<void> {
    await initDatabase();
    const account = memoryStorage.accounts.find(a => a.id === id);
    if (account) {
        Object.assign(account, updates);
        await saveToStorage();
    }
}

export async function getTransactionsByAccount(accountId: string): Promise<Transaction[]> {
    await initDatabase();
    return memoryStorage.transactions
        .filter(t => t.account_id === accountId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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

// ============ RECURRING TRANSACTIONS ============

export async function getAllRecurringTransactions(): Promise<RecurringTransaction[]> {
    await initDatabase();
    return [...(memoryStorage.recurringTransactions || [])].sort((a, b) =>
        new Date(a.next_date).getTime() - new Date(b.next_date).getTime()
    );
}

export async function addRecurringTransaction(input: RecurringTransactionInput): Promise<RecurringTransaction> {
    await initDatabase();
    const id = generateUUID();
    const created_at = new Date().toISOString();

    const recurring: RecurringTransaction = {
        id,
        name: input.name,
        amount: input.amount,
        type: input.type,
        category_id: input.category_id,
        account_id: input.account_id,
        frequency: input.frequency,
        day_of_month: input.day_of_month,
        next_date: input.next_date,
        is_active: true,
        created_at,
        notification_id: null,
        reminder_enabled: input.reminder_enabled || false,
    };

    if (input.reminder_enabled) {
        const notifId = await NotificationService.scheduleRecurringReminder(recurring);
        if (notifId) {
            recurring.notification_id = notifId;
        }
    }

    if (!memoryStorage.recurringTransactions) {
        memoryStorage.recurringTransactions = [];
    }
    memoryStorage.recurringTransactions.push(recurring);
    await saveToStorage();
    return recurring;
}

export async function updateRecurringTransaction(
    id: string,
    input: Partial<RecurringTransactionInput>
): Promise<void> {
    await initDatabase();
    const index = memoryStorage.recurringTransactions?.findIndex(r => r.id === id) ?? -1;
    if (index === -1) throw new Error('Recurring transaction not found');

    memoryStorage.recurringTransactions[index] = {
        ...memoryStorage.recurringTransactions[index],
        ...input,
    };
    await saveToStorage();
}

export async function deleteRecurringTransaction(id: string): Promise<void> {
    await initDatabase();
    if (!memoryStorage.recurringTransactions) return;

    const recurring = memoryStorage.recurringTransactions.find(r => r.id === id);
    if (recurring?.notification_id) {
        await NotificationService.cancelNotification(recurring.notification_id);
    }

    memoryStorage.recurringTransactions = memoryStorage.recurringTransactions.filter(r => r.id !== id);
    await saveToStorage();
}

export async function toggleRecurringTransaction(id: string): Promise<void> {
    await initDatabase();
    const recurring = memoryStorage.recurringTransactions?.find(r => r.id === id);
    if (recurring) {
        recurring.is_active = !recurring.is_active;
        await saveToStorage();
    }
}

// Process recurring transactions - creates actual transactions for due recurring items
export async function processRecurringTransactions(): Promise<number> {
    await initDatabase();

    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    let processedCount = 0;
    const recurringList = memoryStorage.recurringTransactions?.filter(r => r.is_active) || [];

    for (const recurring of recurringList) {
        let nextDate = new Date(recurring.next_date);

        // Process all due occurrences (in case app wasn't opened for multiple periods)
        while (nextDate <= today) {
            // Create actual transaction for this occurrence
            const dateString = nextDate.toISOString().split('T')[0];

            // Check if this transaction was already created (avoid duplicates)
            const existingTx = memoryStorage.transactions.find(
                t => t.recurring_id === recurring.id && t.date === dateString
            );

            if (!existingTx) {
                const id = generateUUID();
                const created_at = new Date().toISOString();

                const transaction = {
                    id,
                    type: recurring.type,
                    amount: recurring.amount,
                    category_id: recurring.category_id,
                    account_id: recurring.account_id,
                    description: recurring.name,
                    date: dateString,
                    is_recurring: true,
                    recurring_id: recurring.id,
                    calendar_event_id: null,
                    synced: false,
                    created_at,
                };

                memoryStorage.transactions.push(transaction);

                // Update account balance (since the date is in the past or today)
                updateAccountBalanceHelper(recurring.account_id, recurring.amount, recurring.type);

                processedCount++;
                console.log(`[Recurring] Processed: ${recurring.name} for ${dateString}`);
            }

            // Calculate next occurrence based on frequency
            switch (recurring.frequency) {
                case 'daily':
                    nextDate.setDate(nextDate.getDate() + 1);
                    break;
                case 'weekly':
                    nextDate.setDate(nextDate.getDate() + 7);
                    break;
                case 'monthly':
                    nextDate.setMonth(nextDate.getMonth() + 1);
                    // Handle day_of_month if specified
                    if (recurring.day_of_month) {
                        nextDate.setDate(recurring.day_of_month);
                    }
                    break;
                case 'yearly':
                    nextDate.setFullYear(nextDate.getFullYear() + 1);
                    if (recurring.day_of_month) {
                        nextDate.setDate(recurring.day_of_month);
                    }
                    break;
            }
        }

        // Update recurring transaction's next_date
        recurring.next_date = nextDate.toISOString();
    }

    if (processedCount > 0) {
        await saveToStorage();
    }

    return processedCount;
}

// ============ GOALS ============

export async function getAllGoals(): Promise<Goal[]> {
    await initDatabase();
    return [...(memoryStorage.goals || [])].sort((a, b) =>
        new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    );
}

export async function addGoal(input: GoalInput): Promise<Goal> {
    await initDatabase();
    const id = generateUUID();
    const created_at = new Date().toISOString();

    // Calculate months until deadline using proper date arithmetic
    const now = new Date();
    const deadline = new Date(input.deadline);
    const monthsDiff = getMonthsDiff(now, deadline);
    const monthly_target = Math.ceil(input.target_amount / monthsDiff);

    const goal: Goal = {
        id,
        name: input.name,
        target_amount: input.target_amount,
        current_amount: 0,
        deadline: input.deadline,
        monthly_target,
        created_at,
        is_active: true,
    };

    if (!memoryStorage.goals) {
        memoryStorage.goals = [];
    }
    memoryStorage.goals.push(goal);
    await saveToStorage();
    return goal;
}

export async function updateGoal(id: string, input: Partial<GoalInput>): Promise<void> {
    await initDatabase();
    const index = memoryStorage.goals?.findIndex(g => g.id === id) ?? -1;
    if (index === -1) throw new Error('Goal not found');

    const goal = memoryStorage.goals[index];

    // Recalculate monthly target if deadline or target amount changed
    if (input.deadline || input.target_amount) {
        const targetAmount = input.target_amount ?? goal.target_amount;
        const deadline = new Date(input.deadline ?? goal.deadline);
        const now = new Date();
        const monthsDiff = getMonthsDiff(now, deadline);
        goal.monthly_target = Math.ceil((targetAmount - goal.current_amount) / monthsDiff);
    }

    memoryStorage.goals[index] = {
        ...goal,
        ...input,
    };
    await saveToStorage();
}

export async function deleteGoal(id: string): Promise<void> {
    await initDatabase();
    if (!memoryStorage.goals) return;
    memoryStorage.goals = memoryStorage.goals.filter(g => g.id !== id);
    await saveToStorage();
}

export async function addGoalDeposit(id: string, amount: number): Promise<void> {
    await initDatabase();
    const goal = memoryStorage.goals?.find(g => g.id === id);
    if (goal) {
        goal.current_amount += amount;

        // Recalculate monthly target based on remaining amount using proper date arithmetic
        const deadline = new Date(goal.deadline);
        const now = new Date();
        const monthsDiff = getMonthsDiff(now, deadline);
        goal.monthly_target = Math.ceil((goal.target_amount - goal.current_amount) / monthsDiff);

        await saveToStorage();
    }
}

export async function getActiveGoals(): Promise<Goal[]> {
    await initDatabase();
    return [...(memoryStorage.goals || [])].filter(g => g.is_active && g.current_amount < g.target_amount);
}
