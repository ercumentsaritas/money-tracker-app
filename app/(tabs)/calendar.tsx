import React, { useState, useCallback, useMemo } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    ScrollView,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { CaretLeft, CaretRight, CalendarBlank, ArrowUp, ArrowDown } from 'phosphor-react-native';
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
    const isDark = colorScheme === 'dark';

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
        return day === 0 ? 6 : day - 1;
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

    const calendarDays = useMemo(() => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const days: (number | null)[] = [];

        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }

        return days;
    }, [currentDate]);

    const getTransactionsForDate = useCallback((day: number) => {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return transactions.filter(t => t.date.startsWith(dateStr));
    }, [transactions, currentDate]);

    const selectedDateTransactions = useMemo(() => {
        if (!selectedDate) return [];
        return transactions.filter(t => t.date.startsWith(selectedDate));
    }, [transactions, selectedDate]);

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

    const renderDay = ({ item: day }: { item: number | null; index: number }) => {
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
                    today && !selected && [styles.todayCell, { borderColor: colors.tint }],
                    selected && [styles.selectedCell, { backgroundColor: colors.tint }],
                ]}
                onPress={() => handleDayPress(day)}
                activeOpacity={0.6}
            >
                <Text
                    style={[
                        styles.dayNumber,
                        { color: selected ? '#FFFFFF' : colors.text },
                        today && !selected && { color: colors.tint, fontFamily: 'Outfit_600SemiBold' },
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
        const isIncome = item.type === 'income';

        return (
            <View
                style={[styles.transactionItem, { borderBottomColor: colors.border }]}
            >
                <View style={[styles.txIconContainer, {
                    backgroundColor: isIncome ? colors.income + '10' : colors.expense + '10'
                }]}>
                    {isIncome ? (
                        <ArrowUp size={16} color={colors.income} weight="light" />
                    ) : (
                        <ArrowDown size={16} color={colors.expense} weight="light" />
                    )}
                </View>
                <View style={styles.transactionContent}>
                    <Text style={[styles.transactionName, { color: colors.text }]}>{item.description}</Text>
                    <Text style={[styles.transactionCategory, { color: colors.textSecondary }]}>
                        {category.name}
                    </Text>
                </View>
                <Text style={[
                    styles.transactionAmount,
                    { color: isIncome ? colors.income : colors.expense }
                ]}>
                    {formatAmount(item.amount, item.type)}
                </Text>
            </View>
        );
    };

    // Monthly summary
    const monthlyIncome = transactions
        .filter(t => {
            const d = new Date(t.date);
            return d.getFullYear() === currentDate.getFullYear() &&
                d.getMonth() === currentDate.getMonth() &&
                t.type === 'income';
        })
        .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpense = transactions
        .filter(t => {
            const d = new Date(t.date);
            return d.getFullYear() === currentDate.getFullYear() &&
                d.getMonth() === currentDate.getMonth() &&
                t.type === 'expense';
        })
        .reduce((sum, t) => sum + t.amount, 0);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.headerSection}>
                    <Text style={[styles.pageTitle, { color: colors.text }]}>Takvim</Text>
                </View>

                {/* Month Nav */}
                <View style={styles.monthNav}>
                    <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
                        <CaretLeft size={20} color={colors.text} weight="regular" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={goToToday}>
                        <Text style={[styles.monthText, { color: colors.text }]}>
                            {MONTHS_TR[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
                        <CaretRight size={20} color={colors.text} weight="regular" />
                    </TouchableOpacity>
                </View>

                {/* Monthly Summary */}
                <View style={styles.monthSummary}>
                    <View style={[styles.monthSummaryItem, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.monthSummaryLabel, { color: colors.textSecondary }]}>Gelir</Text>
                        <Text style={[styles.monthSummaryAmount, { color: colors.income }]}>
                            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(monthlyIncome)}
                        </Text>
                    </View>
                    <View style={[styles.monthSummaryItem, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.monthSummaryLabel, { color: colors.textSecondary }]}>Gider</Text>
                        <Text style={[styles.monthSummaryAmount, { color: colors.expense }]}>
                            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(monthlyExpense)}
                        </Text>
                    </View>
                </View>

                {/* Calendar Grid */}
                <View style={[styles.calendar, { backgroundColor: colors.surface }]}>
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
                </View>

                {/* Transactions for selected date */}
                {selectedDate && (
                    <View style={styles.transactionsSection}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('tr-TR', {
                                day: 'numeric',
                                month: 'long',
                                weekday: 'long',
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
                                <CalendarBlank size={40} color={colors.textSecondary} weight="light" />
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                    Bu tarihte işlem yok
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

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
    },
    pageTitle: {
        fontSize: 28,
        fontFamily: 'DMSerifDisplay_400Regular',
    },
    monthNav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    navButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    monthText: {
        fontSize: 17,
        fontFamily: 'Outfit_600SemiBold',
    },
    monthSummary: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    monthSummaryItem: {
        flex: 1,
        padding: 14,
        borderRadius: 14,
        alignItems: 'center',
        gap: 4,
    },
    monthSummaryLabel: {
        fontSize: 11,
        fontFamily: 'Outfit_500Medium',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    monthSummaryAmount: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        letterSpacing: -0.3,
    },
    calendar: {
        marginHorizontal: 16,
        borderRadius: 16,
        padding: 4,
    },
    weekRow: {
        flexDirection: 'row',
        marginBottom: 4,
        justifyContent: 'space-between',
    },
    dayCell: {
        width: (Dimensions.get('window').width - 32 - 24) / 7, // (screen - margin - padding) / 7
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        margin: 1,
    },
    todayCell: {
        borderWidth: 1.5,
    },
    selectedCell: {
        borderRadius: 12,
    },
    dayName: {
        fontSize: 11,
        fontFamily: 'Outfit_500Medium',
        letterSpacing: 0.5,
    },
    dayNumber: {
        fontSize: 14,
        fontFamily: 'Outfit_500Medium',
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
    transactionsSection: {
        padding: 20,
        paddingTop: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        marginBottom: 12,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    txIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    transactionContent: {
        flex: 1,
        marginLeft: 12,
    },
    transactionName: {
        fontSize: 14,
        fontFamily: 'Outfit_500Medium',
    },
    transactionCategory: {
        fontSize: 12,
        fontFamily: 'Outfit_400Regular',
        marginTop: 2,
    },
    transactionAmount: {
        fontSize: 14,
        fontFamily: 'Outfit_600SemiBold',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 32,
        gap: 8,
    },
    emptyText: {
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
    },
});
