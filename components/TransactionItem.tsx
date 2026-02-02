import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Transaction, Category } from '@/types';

interface TransactionItemProps {
    transaction: Transaction;
    category?: Category;
    onPress?: (transaction: Transaction) => void;
    onDelete?: (id: string) => void;
}

export function TransactionItem({ transaction, category, onPress, onDelete }: TransactionItemProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const isIncome = transaction.type === 'income';
    const isDark = colorScheme === 'dark';

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    };

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const typeColor = isIncome ? colors.income : colors.expense;
    const iconBgColor = isIncome
        ? (isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.1)')
        : (isDark ? 'rgba(251, 113, 133, 0.15)' : 'rgba(244, 63, 94, 0.1)');

    return (
        <TouchableOpacity
            style={[
                styles.container,
                {
                    backgroundColor: colors.surface,
                    borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                }
            ]}
            onPress={() => onPress?.(transaction)}
            activeOpacity={0.7}
        >
            {/* Category Icon */}
            <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
                <Ionicons
                    name={(category?.icon as any) || (isIncome ? 'arrow-up' : 'arrow-down')}
                    size={20}
                    color={typeColor}
                />
            </View>

            {/* Content */}
            <View style={styles.content}>
                <Text style={[styles.description, { color: colors.text }]} numberOfLines={1}>
                    {transaction.description || category?.name || 'İşlem'}
                </Text>
                <View style={styles.metaRow}>
                    <View style={[styles.categoryBadge, { backgroundColor: colors.surfaceAlt }]}>
                        <Text style={[styles.categoryText, { color: colors.textSecondary }]}>
                            {category?.name || 'Kategori'}
                        </Text>
                    </View>
                    <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                        {formatDate(transaction.date)}
                    </Text>
                </View>
            </View>

            {/* Amount */}
            <View style={styles.amountContainer}>
                <Text style={[styles.amount, { color: typeColor }]}>
                    {isIncome ? '+' : '-'}{formatAmount(transaction.amount)}
                </Text>
                {transaction.is_recurring && (
                    <View style={[styles.recurringBadge, { backgroundColor: colors.tint + '15' }]}>
                        <Ionicons name="sync" size={10} color={colors.tint} />
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        marginLeft: 14,
    },
    description: {
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: -0.3,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        gap: 8,
    },
    categoryBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    dateText: {
        fontSize: 12,
        fontWeight: '500',
    },
    amountContainer: {
        alignItems: 'flex-end',
    },
    amount: {
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    recurringBadge: {
        marginTop: 4,
        padding: 4,
        borderRadius: 6,
    },
});
