import React, { useState, useCallback, useMemo } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Transaction, Category } from '@/types';
import { getAllTransactions, getAllCategories, initDatabase } from '@/database';
import { FAB } from '@/components/FAB';

const MONTHS_TR = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

const DAYS_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export default function CalendarScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

    const loadData = useCallback(async () => {
        await initDatabase();
        const [txns, cats] = await Promise.all([
            getAllTransactions(),
            getAllCategories(),
        ]);
        setTransactions(txns);
        setCategories(cats);
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
        return day === 0 ? 6 : day - 1; // Convert to Monday-based (0 = Monday)
    };

    const goToPreviousMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
        setSelectedDate(null);
    };

    const goToNextMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
        setSelectedDate(null);
    };

    const goToToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today.toISOString().split('T')[0]);
    };

    // Generate calendar days for current month
    const calendarDays = useMemo(() => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const days: (number | null)[] = [];

        // Add empty cells for days before the first day of month
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }

        // Add days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }

        return days;
    }, [currentDate]);

    // Get transactions for a specific date
    const getTransactionsForDate = useCallback((day: number) => {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return transactions.filter(t => t.date.startsWith(dateStr));
    }, [transactions, currentDate]);

    // Get transactions for selected date
    const selectedDateTransactions = useMemo(() => {
        if (!selectedDate) return [];
        return transactions.filter(t => t.date.startsWith(selectedDate));
    }, [transactions, selectedDate]);

    // Calculate totals for a date
    const getDateTotals = useCallback((day: number) => {
        const dayTransactions = getTransactionsForDate(day);
        const income = dayTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        const expense = dayTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        return { income, expense, count: dayTransactions.length };
    }, [getTransactionsForDate]);

    const isToday = (day: number) => {
        const today = new Date();
        return (
            today.getFullYear() === currentDate.getFullYear() &&
            today.getMonth() === currentDate.getMonth() &&
            today.getDate() === day
        );
    };

    const isSelectedDay = (day: number) => {
        if (!selectedDate) return false;
        const dayStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return selectedDate === dayStr;
    };

    const handleDayPress = (day: number) => {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        setSelectedDate(dateStr);
    };

    const handleAddTransaction = () => {
        const dateToUse = selectedDate || new Date().toISOString().split('T')[0];
        router.push({
            pathname: '/add-transaction',
            params: { date: dateToUse }
        });
    };

    const formatAmount = (amount: number, type: string) => {
        const formatted = new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 0,
        }).format(amount);
        return type === 'income' ? `+${formatted}` : `-${formatted}`;
    };

    const getCategoryById = (id: string): Category => {
        const category = categories.find(c => c.id === id);
        return category ?? {
            id: 'unknown',
            name: 'Bilinmeyen',
            type: 'expense',
            icon: 'help-circle',
            color: '#999999'
        };
    };

    const renderDay = ({ item: day, index }: { item: number | null; index: number }) => {
        if (day === null) {
            return <View style={styles.dayCell} />;
        }

        const totals = getDateTotals(day);
        const hasTransactions = totals.count > 0;
        const today = isToday(day);
        const selected = isSelectedDay(day);

        return (
            <TouchableOpacity
                style={[
                    styles.dayCell,
                    today && { borderColor: colors.tint, borderWidth: 1 },
                    selected && { backgroundColor: colors.tint },
                ]}
                onPress={() => handleDayPress(day)}
            >
                <Text
                    style={[
                        styles.dayNumber,
                        { color: selected ? '#FFFFFF' : colors.text },
                        today && !selected && { color: colors.tint },
                    ]}
                >
                    {day}
                </Text>
                {hasTransactions && (
                    <View style={styles.indicators}>
                        {totals.income > 0 && (
                            <View style={[styles.indicator, { backgroundColor: selected ? '#FFFFFF' : colors.income }]} />
                        )}
                        {totals.expense > 0 && (
                            <View style={[styles.indicator, { backgroundColor: selected ? '#FFFFFF' : colors.expense }]} />
                        )}
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const renderTransaction = ({ item }: { item: Transaction }) => {
        const category = getCategoryById(item.category_id);
        return (
            <TouchableOpacity
                style={[styles.transactionItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
                <View style={[
                    styles.iconContainer,
                    { backgroundColor: item.type === 'income' ? colors.income + '15' : colors.expense + '15' }
                ]}>
                    <Ionicons
                        name={category.icon as any || (item.type === 'income' ? 'trending-up' : 'trending-down')}
                        size={22}
                        color={item.type === 'income' ? colors.income : colors.expense}
                    />
                </View>
                <View style={styles.transactionContent}>
                    <Text style={[styles.transactionName, { color: colors.text }]}>{item.description}</Text>
                    <Text style={[styles.transactionCategory, { color: colors.textSecondary }]}>
                        {category.name}
                    </Text>
                </View>
                <Text style={[
                    styles.transactionAmount,
                    { color: item.type === 'income' ? colors.income : colors.expense }
                ]}>
                    {formatAmount(item.amount, item.type)}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerText, { color: colors.text }]}>
                    {MONTHS_TR[currentDate.getMonth()]} {currentDate.getFullYear()}
                </Text>
                <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
                    <Ionicons name="chevron-forward" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView>
                {/* Calendar Grid */}
                <View style={styles.calendar}>
                    {/* Day names */}
                    <View style={styles.weekRow}>
                        {DAYS_TR.map((day) => (
                            <View key={day} style={styles.dayCell}>
                                <Text style={[styles.dayName, { color: colors.textSecondary }]}>
                                    {day}
                                </Text>
                            </View>
                        ))}
                    </View>

                    {/* Calendar days */}
                    <FlatList
                        data={calendarDays}
                        renderItem={renderDay}
                        keyExtractor={(_, index) => index.toString()}
                        numColumns={7}
                        scrollEnabled={false}
                    />

                    {/* Today button */}
                    <TouchableOpacity
                        style={[styles.todayButton, { backgroundColor: colors.tint + '15', borderColor: colors.tint }]}
                        onPress={goToToday}
                    >
                        <Ionicons name="today" size={18} color={colors.tint} />
                        <Text style={[styles.todayButtonText, { color: colors.tint }]}>Bugüne Git</Text>
                    </TouchableOpacity>
                </View>

                {/* Transactions for selected date */}
                {selectedDate && (
                    <View style={styles.transactionsSection}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('tr-TR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })}
                        </Text>
                        {selectedDateTransactions.length > 0 ? (
                            <FlatList
                                data={selectedDateTransactions}
                                renderItem={renderTransaction}
                                keyExtractor={(item) => item.id}
                                scrollEnabled={false}
                            />
                        ) : (
                            <View style={styles.emptyState}>
                                <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} style={{ opacity: 0.5 }} />
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                    Bu tarihte işlem yok
                                </Text>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>

            <FAB onPress={handleAddTransaction} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    navButton: {
        padding: 8,
    },
    headerText: {
        fontSize: 17,
        fontWeight: '600',
    },
    calendar: {
        padding: 16,
    },
    weekRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    dayCell: {
        width: '14.28%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    dayName: {
        fontSize: 12,
        fontWeight: '500',
    },
    dayNumber: {
        fontSize: 15,
        fontWeight: '500',
    },
    indicators: {
        flexDirection: 'row',
        gap: 3,
        marginTop: 2,
    },
    indicator: {
        width: 4,
        height: 4,
        borderRadius: 2,
    },
    todayButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        marginTop: 16,
        alignSelf: 'center',
    },
    todayButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    transactionsSection: {
        padding: 16,
        paddingTop: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 8,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    transactionContent: {
        flex: 1,
        marginLeft: 12,
    },
    transactionName: {
        fontSize: 15,
        fontWeight: '500',
    },
    transactionCategory: {
        fontSize: 13,
        marginTop: 2,
    },
    transactionAmount: {
        fontSize: 15,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    emptyText: {
        fontSize: 14,
        marginTop: 12,
    },
});
