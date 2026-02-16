import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { Receipt, Funnel } from 'phosphor-react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { TransactionItem } from '@/components/TransactionItem';
import { FAB } from '@/components/FAB';
import { getAllTransactions, getAllCategories, deleteTransaction } from '@/database';
import { Transaction, Category } from '@/types';

export default function TransactionsScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

    const loadData = useCallback(async () => {
        try {
            const [txns, cats] = await Promise.all([
                getAllTransactions(),
                getAllCategories(),
            ]);
            setTransactions(txns);
            setCategories(cats);
        } catch (error) {
            console.error('Failed to load transactions:', error);
        }
    }, []);

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

    const handleDelete = async (id: string) => {
        await deleteTransaction(id);
        await loadData();
    };

    const filteredTransactions = transactions.filter(t => {
        if (filter === 'all') return true;
        return t.type === filter;
    });

    const handleAddTransaction = () => {
        router.push('/add-transaction');
    };

    // Summary stats
    const totalIncome = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    // Group transactions by date
    const groupedTransactions = filteredTransactions.reduce((groups: Record<string, Transaction[]>, transaction) => {
        const date = transaction.date.split('T')[0];
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(transaction);
        return groups;
    }, {});

    const sections = Object.entries(groupedTransactions).map(([date, items]) => ({
        date,
        items,
    }));

    const formatSectionDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'Bugün';
        if (date.toDateString() === yesterday.toDateString()) return 'Dün';
        return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            {/* Header */}
            <View style={styles.headerSection}>
                <Text style={[styles.pageTitle, { color: colors.text }]}>İşlemler</Text>
                <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>
                    {filteredTransactions.length} işlem
                </Text>
            </View>

            {/* Summary Cards */}
            <View style={styles.summaryRow}>
                <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Gelir</Text>
                    <Text style={[styles.summaryAmount, { color: colors.income }]}>
                        {formatAmount(totalIncome)}
                    </Text>
                </View>
                <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Gider</Text>
                    <Text style={[styles.summaryAmount, { color: colors.expense }]}>
                        {formatAmount(totalExpense)}
                    </Text>
                </View>
            </View>

            {/* Filter buttons */}
            <View style={styles.filterRow}>
                {(['all', 'income', 'expense'] as const).map((type) => (
                    <TouchableOpacity
                        key={type}
                        style={[
                            styles.filterButton,
                            {
                                backgroundColor: filter === type ? colors.tint : 'transparent',
                                borderColor: filter === type ? colors.tint : colors.border,
                            },
                        ]}
                        onPress={() => setFilter(type)}
                    >
                        <Text
                            style={[
                                styles.filterText,
                                { color: filter === type ? '#FFF' : colors.textSecondary },
                            ]}
                        >
                            {type === 'all' ? 'Tümü' : type === 'income' ? 'Gelir' : 'Gider'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={sections}
                keyExtractor={(item) => item.date}
                keyboardShouldPersistTaps="handled"
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
                }
                renderItem={({ item: section }) => (
                    <View>
                        <Text style={[styles.sectionDate, { color: colors.textSecondary }]}>
                            {formatSectionDate(section.date)}
                        </Text>
                        {section.items.map(transaction => (
                            <TransactionItem
                                key={transaction.id}
                                transaction={transaction}
                                category={getCategoryById(transaction.category_id)}
                                onDelete={handleDelete}
                            />
                        ))}
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Receipt size={48} color={colors.textSecondary} weight="light" />
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>
                            İşlem bulunamadı
                        </Text>
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            İlk işleminizi eklemek için + butonuna tıklayın
                        </Text>
                    </View>
                }
                contentContainerStyle={styles.list}
            />
            <FAB onPress={handleAddTransaction} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerSection: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 4,
    },
    pageTitle: {
        fontSize: 28,
        fontFamily: 'DMSerifDisplay_400Regular',
    },
    pageSubtitle: {
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
        marginTop: 2,
    },
    summaryRow: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 20,
        marginTop: 16,
        marginBottom: 4,
    },
    summaryCard: {
        flex: 1,
        padding: 14,
        borderRadius: 14,
        alignItems: 'center',
        gap: 4,
    },
    summaryLabel: {
        fontSize: 11,
        fontFamily: 'Outfit_500Medium',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    summaryAmount: {
        fontSize: 18,
        fontFamily: 'Outfit_600SemiBold',
        letterSpacing: -0.3,
    },
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 8,
    },
    filterButton: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
    },
    filterText: {
        fontFamily: 'Outfit_500Medium',
        fontSize: 13,
        letterSpacing: 0.3,
    },
    list: {
        paddingBottom: 100,
    },
    sectionDate: {
        fontSize: 11,
        fontFamily: 'Outfit_600SemiBold',
        marginHorizontal: 20,
        marginTop: 16,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    empty: {
        alignItems: 'center',
        paddingVertical: 64,
        gap: 8,
    },
    emptyTitle: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        marginTop: 8,
    },
    emptyText: {
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
    },
});
