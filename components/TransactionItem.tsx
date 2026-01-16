import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
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

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    };

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
        }).format(amount);
    };

    return (
        <TouchableOpacity
            style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => onPress?.(transaction)}
            activeOpacity={0.7}
        >
            <View style={[styles.iconContainer, { backgroundColor: category?.color || colors.tint + '20' }]}>
                <Ionicons
                    name={(category?.icon as any) || 'cash-outline'}
                    size={22}
                    color={category?.color || colors.tint}
                />
            </View>

            <View style={styles.content}>
                <Text style={[styles.description, { color: colors.text }]} numberOfLines={1}>
                    {transaction.description || category?.name || 'İşlem'}
                </Text>
                <Text style={[styles.category, { color: colors.textSecondary }]}>
                    {category?.name || 'Kategori'} • {formatDate(transaction.date)}
                </Text>
            </View>

            <Text style={[styles.amount, { color: isIncome ? colors.income : colors.expense }]}>
                {isIncome ? '+' : '-'}{formatAmount(transaction.amount)}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        marginHorizontal: 16,
        marginVertical: 4,
        borderRadius: 14,
        borderWidth: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0.15,
    },
    content: {
        flex: 1,
        marginLeft: 12,
    },
    description: {
        fontSize: 15,
        fontWeight: '500',
    },
    category: {
        fontSize: 12,
        marginTop: 3,
    },
    amount: {
        fontSize: 15,
        fontWeight: '600',
    },
});
