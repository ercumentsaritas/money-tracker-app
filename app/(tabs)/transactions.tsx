import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Filter buttons */}
            <View style={styles.filterRow}>
                {(['all', 'income', 'expense'] as const).map((type) => (
                    <TouchableOpacity
                        key={type}
                        style={[
                            styles.filterButton,
                            {
                                backgroundColor: filter === type ? colors.tint : colors.surface,
                                borderColor: colors.border,
                            },
                        ]}
                        onPress={() => setFilter(type)}
                    >
                        <Text
                            style={[
                                styles.filterText,
                                { color: filter === type ? '#FFF' : colors.text },
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
                        <Ionicons name="receipt-outline" size={64} color={colors.textSecondary} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            İşlem bulunamadı
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
    filterRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
    },
    filterButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
    },
    filterText: {
        fontWeight: '500',
        fontSize: 13,
        letterSpacing: 0.3,
    },
    list: {
        paddingBottom: 100,
    },
    sectionDate: {
        fontSize: 13,
        fontWeight: '600',
        marginHorizontal: 20,
        marginTop: 16,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    empty: {
        alignItems: 'center',
        paddingVertical: 64,
    },
    emptyText: {
        fontSize: 16,
        marginTop: 16,
    },
});
