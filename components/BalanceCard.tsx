import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface BalanceCardProps {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    month: string;
    accountBalance?: number; // Actual cash account balance
}

export function BalanceCard({ totalIncome, totalExpense, balance, month, accountBalance }: BalanceCardProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Use accountBalance if provided, otherwise fall back to monthly balance
    const displayBalance = accountBalance !== undefined ? accountBalance : balance;

    return (
        <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.monthLabel, { color: colors.textSecondary }]}>{month}</Text>
            <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Toplam Bakiye</Text>
            <Text style={[styles.balanceAmount, { color: colors.text }]}>{formatAmount(displayBalance)}</Text>

            <View style={[styles.row, { borderTopColor: colors.border }]}>
                <View style={styles.stat}>
                    <View style={[styles.indicator, { backgroundColor: colors.income }]} />
                    <View>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Gelir</Text>
                        <Text style={[styles.statAmount, { color: colors.income }]}>{formatAmount(totalIncome)}</Text>
                    </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.stat}>
                    <View style={[styles.indicator, { backgroundColor: colors.expense }]} />
                    <View>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Gider</Text>
                        <Text style={[styles.statAmount, { color: colors.expense }]}>{formatAmount(totalExpense)}</Text>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        margin: 16,
        padding: 24,
        borderRadius: 20,
        borderWidth: 1,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
    },
    monthLabel: {
        fontSize: 13,
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    balanceLabel: {
        fontSize: 14,
        marginTop: 16,
    },
    balanceAmount: {
        fontSize: 40,
        fontWeight: '300',
        marginTop: 4,
        letterSpacing: -1,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 24,
        paddingTop: 20,
        borderTopWidth: 1,
    },
    stat: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    indicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 10,
    },
    statLabel: {
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statAmount: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 4,
    },
    divider: {
        width: 1,
        height: 36,
        marginHorizontal: 16,
    },
});
