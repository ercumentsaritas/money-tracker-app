import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, RefreshControl, TouchableOpacity, Modal, TextInput, Alert, Keyboard } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { List, Bell, Flag, Wallet, Receipt, Plus, Info } from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { BalanceCard } from '@/components/BalanceCard';
import { TransactionItem } from '@/components/TransactionItem';
import { AccountCard } from '@/components/AccountCard';
import { GoalCard } from '@/components/GoalCard';
import { FAB } from '@/components/FAB';
import { SideDrawer } from '@/components/SideDrawer';
import { initDatabase, getTransactionsByMonth, getMonthlyStats, getAllCategories, getAllAccounts, getActiveGoals, addGoal } from '@/database';
import { Transaction, Category, Account, Goal, GoalInput } from '@/types';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [totalDebt, setTotalDebt] = useState(0);
  const [monthlyDebtPayment, setMonthlyDebtPayment] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [addingGoal, setAddingGoal] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

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

      // Load debt info from AsyncStorage
      const [savedDebt, savedMonthly] = await Promise.all([
        AsyncStorage.getItem('user_total_debt'),
        AsyncStorage.getItem('user_monthly_debt_payment'),
      ]);
      setTotalDebt(savedDebt ? parseFloat(savedDebt) : 0);
      setMonthlyDebtPayment(savedMonthly ? parseFloat(savedMonthly) : 0);
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

  const renderHeader = () => (
    <View style={[styles.headerBar, { paddingTop: 12 }]}>
      <TouchableOpacity style={styles.headerIcon} onPress={() => setDrawerVisible(true)}>
        <List size={22} color={colors.text} weight="light" />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]}>{monthName}</Text>
      <TouchableOpacity style={styles.headerIcon}>
        <Bell size={22} color={colors.text} weight="light" />
      </TouchableOpacity>
    </View>
  );

  const renderGoalsSection = () => (
    <>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Hedefler</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.tint + '12' }]}
          onPress={() => setShowAddGoalModal(true)}
        >
          <Plus size={16} color={colors.tint} weight="regular" />
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
          <View style={[styles.emptyIconContainer, { backgroundColor: colors.tint + '08' }]}>
            <Flag size={24} color={colors.tint} weight="light" />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Henüz hedef yok
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Finansal hedeflerinizi takip edin
          </Text>
        </TouchableOpacity>
      )}
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
        }
        ListHeaderComponent={
          <>
            {renderHeader()}

            <BalanceCard
              totalIncome={stats.totalIncome}
              totalExpense={stats.totalExpense}
              balance={stats.balance}
              month={monthName}
              accountBalance={accounts.find(a => a.name.toLowerCase().includes('nakit'))?.balance ?? 0}
              totalDebt={totalDebt}
              monthlyDebtPayment={monthlyDebtPayment}
            />

            {/* Goals Section */}
            {renderGoalsSection()}

            {accounts.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Hesaplar</Text>
                </View>
                <View style={[styles.listSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
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
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Son İşlemler</Text>
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
            <Receipt size={32} color={colors.textSecondary} weight="light" />
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
      <SideDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} />

      {/* Add Goal Modal */}
      <Modal visible={showAddGoalModal} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setShowAddGoalModal(false)}>
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
                <Info size={18} color={colors.tint} weight="regular" />
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
  // Minimal Header
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    letterSpacing: 0.3,
    textTransform: 'capitalize',
  },
  // Section headers - minimal
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 28,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // List section container
  listSection: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  // Empty states
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Outfit_500Medium',
    marginTop: 4,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    marginHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 10,
  },
  emptyIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
  },
  emptySubtext: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    textAlign: 'center',
    lineHeight: 18,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 24,
    padding: 24,
    width: '85%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    fontSize: 11,
    fontFamily: 'Outfit_500Medium',
    marginBottom: 6,
    marginTop: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
  },
  monthlyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  monthlyInfoText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 15,
    fontFamily: 'Outfit_600SemiBold',
  },
});
