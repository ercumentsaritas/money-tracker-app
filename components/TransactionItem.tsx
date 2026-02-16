import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { ArrowUp, ArrowDown, ArrowsClockwise } from 'phosphor-react-native';
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
    const iconBgColor = isDark
        ? (isIncome ? 'rgba(143, 174, 139, 0.12)' : 'rgba(212, 184, 150, 0.12)')
        : (isIncome ? 'rgba(91, 111, 91, 0.08)' : 'rgba(184, 160, 138, 0.08)');

    return (
        <TouchableOpacity
            style={[styles.container, { borderBottomColor: colors.border }]}
            onPress={() => onPress?.(transaction)}
            activeOpacity={0.6}
        >
            {/* Category Icon */}
            <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
                {isIncome ? (
                    <ArrowUp size={18} color={typeColor} weight="light" />
                ) : (
                    <ArrowDown size={18} color={typeColor} weight="light" />
                )}
            </View>

            {/* Content */}
            <View style={styles.content}>
                <Text style={[styles.description, { color: colors.text }]} numberOfLines={1}>
                    {transaction.description || category?.name || 'İşlem'}
                </Text>
                <Text style={[styles.categoryText, { color: colors.textSecondary }]}>
                    {category?.name || 'Kategori'} · {formatDate(transaction.date)}
                </Text>
            </View>

            {/* Amount */}
            <View style={styles.amountContainer}>
                <Text style={[styles.amount, { color: typeColor }]}>
                    {isIncome ? '+' : '-'}{formatAmount(transaction.amount)}
                </Text>
                {transaction.is_recurring && (
                    <ArrowsClockwise size={11} color={colors.textSecondary} weight="regular" />
                )}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    iconContainer: {
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        marginLeft: 14,
    },
    description: {
        fontSize: 15,
        fontFamily: 'Outfit_500Medium',
        letterSpacing: -0.2,
    },
    categoryText: {
        fontSize: 12,
        fontFamily: 'Outfit_400Regular',
        marginTop: 3,
    },
    amountContainer: {
        alignItems: 'flex-end',
        gap: 4,
    },
    amount: {
        fontSize: 15,
        fontFamily: 'Outfit_600SemiBold',
        letterSpacing: -0.3,
    },
});
