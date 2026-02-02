import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface BalanceCardProps {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    month: string;
    accountBalance?: number;
}

export function BalanceCard({ totalIncome, totalExpense, balance, month, accountBalance }: BalanceCardProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const isDark = colorScheme === 'dark';

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const displayBalance = accountBalance !== undefined ? accountBalance : balance;
    const isPositive = displayBalance >= 0;

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={isDark
                    ? ['#1E3A5F', '#0F2A47', '#1A3550']
                    : ['#0F4C75', '#1B6CA8', '#3282B8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.monthBadge}>
                        <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.9)" />
                        <Text style={styles.monthText}>{month}</Text>
                    </View>
                    <View style={[styles.statusDot, { backgroundColor: isPositive ? '#34D399' : '#FB7185' }]} />
                </View>

                {/* Main Balance */}
                <View style={styles.balanceSection}>
                    <Text style={styles.balanceLabel}>Toplam Bakiye</Text>
                    <Text style={styles.balanceAmount}>{formatAmount(displayBalance)}</Text>
                    <View style={[styles.trendBadge, { backgroundColor: isPositive ? 'rgba(52, 211, 153, 0.2)' : 'rgba(251, 113, 133, 0.2)' }]}>
                        <Ionicons
                            name={isPositive ? "trending-up" : "trending-down"}
                            size={14}
                            color={isPositive ? "#34D399" : "#FB7185"}
                        />
                        <Text style={[styles.trendText, { color: isPositive ? "#34D399" : "#FB7185" }]}>
                            {isPositive ? "Pozitif" : "Negatif"} bakiye
                        </Text>
                    </View>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    {/* Income Card */}
                    <View style={styles.statCard}>
                        <View style={styles.statIconContainer}>
                            <Ionicons name="arrow-up" size={16} color="#34D399" />
                        </View>
                        <View style={styles.statContent}>
                            <Text style={styles.statLabel}>Gelir</Text>
                            <Text style={styles.statAmount} numberOfLines={1} adjustsFontSizeToFit>{formatAmount(totalIncome)}</Text>
                        </View>
                    </View>

                    {/* Expense Card */}
                    <View style={styles.statCard}>
                        <View style={[styles.statIconContainer, { backgroundColor: 'rgba(251, 113, 133, 0.2)' }]}>
                            <Ionicons name="arrow-down" size={16} color="#FB7185" />
                        </View>
                        <View style={styles.statContent}>
                            <Text style={styles.statLabel}>Gider</Text>
                            <Text style={styles.statAmount} numberOfLines={1} adjustsFontSizeToFit>{formatAmount(totalExpense)}</Text>
                        </View>
                    </View>
                </View>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginTop: 8,
        marginBottom: 16,
        borderRadius: 24,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#0F4C75',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
    },
    gradient: {
        padding: 24,
        borderRadius: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    monthBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    monthText: {
        color: 'rgba(255, 255, 255, 0.95)',
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    balanceSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    balanceLabel: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 14,
        fontWeight: '500',
        letterSpacing: 0.5,
    },
    balanceAmount: {
        color: '#FFFFFF',
        fontSize: 44,
        fontWeight: '700',
        letterSpacing: -2,
        marginVertical: 8,
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    trendText: {
        fontSize: 12,
        fontWeight: '600',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    statCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 14,
        borderRadius: 16,
        gap: 12,
    },
    statIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(52, 211, 153, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statContent: {
        flex: 1,
    },
    statLabel: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 12,
        fontWeight: '500',
    },
    statAmount: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        marginTop: 2,
    },
});
