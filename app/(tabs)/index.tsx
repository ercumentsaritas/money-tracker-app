import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, RefreshControl, TouchableOpacity, Modal, TextInput, Alert, Keyboard } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { BalanceCard } from '@/components/BalanceCard';
import { TransactionItem } from '@/components/TransactionItem';
import { AccountCard } from '@/components/AccountCard';
import { GoalCard } from '@/components/GoalCard';
import { FAB } from '@/components/FAB';
import { initDatabase, getTransactionsByMonth, getMonthlyStats, getAllCategories, getAllAccounts, getActiveGoals, addGoal } from '@/database';
import { Transaction, Category, Account, Goal, GoalInput } from '@/types';
import { router } from 'expo-router';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  // Calculate bottom padding for tab bar
  const tabBarHeight = 60 + insets.bottom;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [stats, setStats] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [addingGoal, setAddingGoal] = useState(false);

  // Add Goal Modal state
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [goalMonths, setGoalMonths] = useState('12');

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

      const [txns, monthStats, cats, accs, activeGoals] = await Promise.all([
        getTransactionsByMonth(currentYear, currentMonth),
        getMonthlyStats(currentYear, currentMonth),
        getAllCategories(),
        getAllAccounts(),
        getActiveGoals(),
      ]);

      setTransactions(txns.slice(0, 5)); // Recent 5 transactions
      setStats({
        totalIncome: monthStats.totalIncome,
        totalExpense: monthStats.totalExpense,
        balance: monthStats.balance,
      });
      setCategories(cats);
      setAccounts(accs);
      setGoals(activeGoals);
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

  const getCategoryById = (id: string): Category => {
    const category = categories.find(c => c.id === id);
    // Return fallback category if not found (deleted category case)
    return category ?? {
      id: 'unknown',
      name: 'Bilinmeyen',
      type: 'expense',
      icon: 'help-circle',
      color: '#999999'
    };
  };

  const handleAddTransaction = () => {
    router.push('/add-transaction');
  };

  const handleAddGoal = async () => {
    if (!goalName.trim()) {
      Alert.alert('Hata', 'Lütfen hedef adı girin');
      return;
    }
    if (!goalAmount || parseFloat(goalAmount) <= 0) {
      Alert.alert('Hata', 'Lütfen geçerli bir hedef tutar girin');
      return;
    }

    const months = parseInt(goalMonths) || 12;
    const deadline = new Date();
    deadline.setMonth(deadline.getMonth() + months);

    setAddingGoal(true);
    try {
      const input: GoalInput = {
        name: goalName.trim(),
        target_amount: parseFloat(goalAmount),
        deadline: deadline.toISOString(),
      };
      await addGoal(input);
      setShowAddGoalModal(false);
      setGoalName('');
      setGoalAmount('');
      setGoalMonths('12');
      loadData();
    } catch (error) {
      console.error('Failed to add goal:', error);
      Alert.alert('Hata', 'Hedef eklenemedi');
    } finally {
      setAddingGoal(false);
    }
  };

  const renderGoalsSection = () => (
    <>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <View style={[styles.sectionIcon, { backgroundColor: colors.tint + '15' }]}>
            <Ionicons name="flag" size={16} color={colors.tint} />
          </View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Hedefler</Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.tint + '15' }]}
          onPress={() => setShowAddGoalModal(true)}
        >
          <Ionicons name="add" size={18} color={colors.tint} />
        </TouchableOpacity>
      </View>
      {goals.length > 0 ? (
        goals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} onDeposit={loadData} />
        ))
      ) : (
        <TouchableOpacity
          style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setShowAddGoalModal(true)}
        >
          <View style={[styles.emptyIconContainer, { backgroundColor: colors.tint + '10' }]}>
            <Ionicons name="flag-outline" size={28} color={colors.tint} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Henüz hedef yok
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Finansal hedeflerinizi takip edin
          </Text>
          <View style={[styles.emptyButton, { backgroundColor: colors.tint }]}>
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text style={styles.emptyButtonText}>Hedef Ekle</Text>
          </View>
        </TouchableOpacity>
      )}
    </>
  );

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
              accountBalance={accounts.find(a => a.name.toLowerCase().includes('nakit'))?.balance ?? 0}
            />

            {/* Goals Section */}
            {renderGoalsSection()}

            {accounts.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <View style={[styles.sectionIcon, { backgroundColor: colors.income + '15' }]}>
                      <Ionicons name="wallet" size={16} color={colors.income} />
                    </View>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Hesaplar</Text>
                  </View>
                </View>
                <View style={styles.accountsContainer}>
                  {accounts.map((account) => (
                    <AccountCard
                      key={account.id}
                      account={account}
                      onPress={() => router.push(`/account-detail?id=${account.id}`)}
                    />
                  ))}
                </View>
              </>
            )}
            {transactions.length > 0 && (
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <View style={[styles.sectionIcon, { backgroundColor: colors.tint + '15' }]}>
                    <Ionicons name="receipt" size={16} color={colors.tint} />
                  </View>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Son İşlemler</Text>
                </View>
              </View>
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
        contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
      />
      <FAB onPress={handleAddTransaction} />

      {/* Add Goal Modal */}
      <Modal visible={showAddGoalModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            Keyboard.dismiss();
            setShowAddGoalModal(false);
          }}
        >
          <View
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={[styles.modalTitle, { color: colors.text }]}>Yeni Hedef</Text>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Hedef Adı</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Örn: Tatil Fonu"
              placeholderTextColor={colors.textSecondary}
              value={goalName}
              onChangeText={setGoalName}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Hedef Tutar</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="₺0"
              placeholderTextColor={colors.textSecondary}
              value={goalAmount}
              onChangeText={setGoalAmount}
              keyboardType="numeric"
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Süre (Ay)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="12"
              placeholderTextColor={colors.textSecondary}
              value={goalMonths}
              onChangeText={setGoalMonths}
              keyboardType="numeric"
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
            />

            {goalAmount && goalMonths && (
              <View style={[styles.monthlyInfo, { backgroundColor: colors.tint + '10' }]}>
                <Ionicons name="information-circle-outline" size={18} color={colors.tint} />
                <Text style={[styles.monthlyInfoText, { color: colors.tint }]}>
                  Aylık ~{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(Math.ceil(parseFloat(goalAmount || '0') / parseInt(goalMonths || '12')))} yatırmanız gerekecek
                </Text>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.surfaceAlt }]}
                onPress={() => setShowAddGoalModal(false)}
                disabled={addingGoal}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.tint, opacity: addingGoal ? 0.6 : 1 }]}
                onPress={handleAddGoal}
                disabled={addingGoal}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                  {addingGoal ? 'Ekleniyor...' : 'Ekle'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingBottom: 120,
  },
  // Modern section header styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 28,
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Empty state styles
  empty: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 12,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  accountsContainer: {
    paddingHorizontal: 16,
    gap: 10,
  },
  // Legacy styles (keeping for compatibility)
  goalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 28,
    marginBottom: 8,
  },
  emptyGoalCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyGoalText: {
    fontSize: 14,
    marginTop: 8,
  },
  emptyGoalSubtext: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 28,
    padding: 28,
    width: 320,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
  },
  monthlyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    marginTop: 20,
  },
  monthlyInfoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
