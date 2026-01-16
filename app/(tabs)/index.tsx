import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { BalanceCard } from '@/components/BalanceCard';
import { TransactionItem } from '@/components/TransactionItem';
import { AccountCard } from '@/components/AccountCard';
import { FAB } from '@/components/FAB';
import { initDatabase, getTransactionsByMonth, getMonthlyStats, getAllCategories, getAllAccounts } from '@/database';
import { Transaction, Category, Account } from '@/types';
import { router } from 'expo-router';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [stats, setStats] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const monthName = now.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

  const loadData = useCallback(async () => {
    try {
      if (!initialized) {
        await initDatabase();
        setInitialized(true);
      }

      const [txns, monthStats, cats, accs] = await Promise.all([
        getTransactionsByMonth(currentYear, currentMonth),
        getMonthlyStats(currentYear, currentMonth),
        getAllCategories(),
        getAllAccounts(),
      ]);

      setTransactions(txns.slice(0, 5)); // Recent 5 transactions
      setStats({
        totalIncome: monthStats.totalIncome,
        totalExpense: monthStats.totalExpense,
        balance: monthStats.balance,
      });
      setCategories(cats);
      setAccounts(accs);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, [initialized, currentYear, currentMonth]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getCategoryById = (id: string) => categories.find(c => c.id === id);

  const handleAddTransaction = () => {
    router.push('/add-transaction');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
        }
        ListHeaderComponent={
          <>
            <BalanceCard
              totalIncome={stats.totalIncome}
              totalExpense={stats.totalExpense}
              balance={stats.balance}
              month={monthName}
            />
            {accounts.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>HESAPLAR</Text>
                <View style={styles.accountsContainer}>
                  {accounts.map((account) => (
                    <AccountCard key={account.id} account={account} />
                  ))}
                </View>
              </>
            )}
            {transactions.length > 0 && (
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SON İŞLEMLER</Text>
            )}
          </>
        }
        renderItem={({ item }) => (
          <TransactionItem
            transaction={item}
            category={getCategoryById(item.category_id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Henüz işlem yok
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              İlk işleminizi eklemek için + butonuna tıklayın
            </Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />
      <FAB onPress={handleAddTransaction} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginHorizontal: 20,
    marginTop: 28,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  accountsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
});
