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
                    ? ['#4F46E5', '#7C3AED', '#6366F1']
                    : ['#6366F1', '#8B5CF6', '#A78BFA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                {/* Decorative circles */}
                <View style={styles.decorCircle1} />
                <View style={styles.decorCircle2} />

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.monthBadge}>
                        <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.9)" />
                        <Text style={styles.monthText}>{month}</Text>
                    </View>
                    <View style={styles.statusDot} />
                </View>

                {/* Main Balance */}
                <View style={styles.balanceSection}>
                    <Text style={styles.balanceLabel}>Toplam Bakiye</Text>
                    <Text style={styles.balanceAmount}>{formatAmount(displayBalance)}</Text>
                    <View style={styles.trendBadge}>
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
        margin: 16,
        borderRadius: 28,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
    },
    gradient: {
        padding: 24,
        paddingTop: 20,
        position: 'relative',
        overflow: 'hidden',
    },
    decorCircle1: {
        position: 'absolute',
        top: -60,
        right: -60,
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    decorCircle2: {
        position: 'absolute',
        bottom: -40,
        left: -40,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
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
        backgroundColor: '#34D399',
        shadowColor: '#34D399',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 8,
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
        marginTop: 8,
        letterSpacing: -1,
        textShadowColor: 'rgba(0, 0, 0, 0.15)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginTop: 12,
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
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
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
