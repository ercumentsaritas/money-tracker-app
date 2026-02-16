import React, { useState, useRef, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, Dimensions, NativeSyntheticEvent, NativeScrollEvent, Platform } from 'react-native';
import { TrendUp, TrendDown, CreditCard } from 'phosphor-react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const screenWidth = Dimensions.get('window').width;
const CARD_HORIZONTAL_MARGIN = 16;
const GAP = 10;
const cardWidth = screenWidth - CARD_HORIZONTAL_MARGIN * 2;

interface BalanceCardProps {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    month: string;
    accountBalance?: number;
    totalDebt?: number;
    monthlyDebtPayment?: number;
}

export function BalanceCard({ totalIncome, totalExpense, balance, month, accountBalance, totalDebt = 0, monthlyDebtPayment = 0 }: BalanceCardProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const [activeIndex, setActiveIndex] = useState(0);

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const formatCompact = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const displayBalance = accountBalance !== undefined ? accountBalance : balance;

    const total = totalIncome + totalExpense;
    const percentChange = total > 0 ? ((totalIncome - totalExpense) / total * 100).toFixed(1) : '0.0';
    const isGrowth = totalIncome >= totalExpense;

    const netWorth = displayBalance - totalDebt;
    const monthsToPayOff = monthlyDebtPayment > 0 ? Math.ceil(totalDebt / monthlyDebtPayment) : 0;

    // Dynamic font size for Android (adjustsFontSizeToFit only works on iOS)
    const getAmountFontSize = useMemo(() => {
        return (amount: number, baseSize: number = 40) => {
            if (Platform.OS === 'ios') return baseSize;
            const formatted = formatAmount(amount);
            const len = formatted.length;
            if (len > 18) return baseSize * 0.55;
            if (len > 15) return baseSize * 0.65;
            if (len > 12) return baseSize * 0.75;
            if (len > 10) return baseSize * 0.85;
            return baseSize;
        };
    }, []);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / (cardWidth + GAP));
        setActiveIndex(index);
    };

    return (
        <View style={styles.wrapper}>
            <ScrollView
                horizontal
                pagingEnabled={false}
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                decelerationRate="fast"
                snapToInterval={cardWidth + GAP}
                snapToAlignment="start"
                contentContainerStyle={{
                    paddingLeft: CARD_HORIZONTAL_MARGIN,
                    paddingRight: CARD_HORIZONTAL_MARGIN,
                    gap: GAP,
                }}
            >
                {/* Page 1: Balance */}
                <View style={[styles.card, { backgroundColor: colors.surface, width: cardWidth }]}>
                    <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
                        TOPLAM BAKİYE
                    </Text>
                    <Text
                        style={[styles.cardAmount, { color: colors.text, fontSize: getAmountFontSize(displayBalance, 40) }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit={Platform.OS === 'ios'}
                        minimumFontScale={Platform.OS === 'ios' ? 0.5 : undefined}
                    >
                        {formatAmount(displayBalance)}
                    </Text>
                    <View style={styles.trendRow}>
                        {isGrowth ? (
                            <TrendUp size={14} color={colors.income} weight="regular" />
                        ) : (
                            <TrendDown size={14} color={colors.expense} weight="regular" />
                        )}
                        <Text style={[styles.trendText, { color: isGrowth ? colors.income : colors.expense }]}>
                            {percentChange}%
                        </Text>
                        <Text style={[styles.trendSecondary, { color: colors.textSecondary }]}>
                            bu ay
                        </Text>
                    </View>
                    <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Gelir</Text>
                            <Text style={[styles.statValue, { color: colors.income }]}>
                                {formatCompact(totalIncome)}
                            </Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Gider</Text>
                            <Text style={[styles.statValue, { color: colors.expense }]}>
                                {formatCompact(totalExpense)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Page 2: Debt */}
                <View style={[styles.card, { backgroundColor: colors.surface, width: cardWidth }]}>
                    <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
                        TOPLAM BORÇ
                    </Text>
                    <Text
                        style={[styles.cardAmount, { color: totalDebt > 0 ? colors.expense : colors.text, fontSize: getAmountFontSize(totalDebt, 40) }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit={Platform.OS === 'ios'}
                        minimumFontScale={Platform.OS === 'ios' ? 0.5 : undefined}
                    >
                        {formatAmount(totalDebt)}
                    </Text>

                    {totalDebt > 0 ? (
                        <View style={styles.trendRow}>
                            <CreditCard size={14} color={colors.textSecondary} weight="regular" />
                            <Text style={[styles.trendSecondary, { color: colors.textSecondary }]}>
                                {monthsToPayOff > 0 ? `~${monthsToPayOff} ay kaldı` : 'Ödeme planı yok'}
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.trendRow}>
                            <Text style={[styles.trendText, { color: colors.income }]}>🎉</Text>
                            <Text style={[styles.trendSecondary, { color: colors.income }]}>
                                Borcunuz yok!
                            </Text>
                        </View>
                    )}

                    <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Net Varlık</Text>
                            <Text style={[styles.statValue, { color: netWorth >= 0 ? colors.income : colors.expense }]}>
                                {formatCompact(netWorth)}
                            </Text>
                        </View>
                        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Aylık Ödeme</Text>
                            <Text style={[styles.statValue, { color: colors.expense }]}>
                                {formatCompact(monthlyDebtPayment)}
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Dot Indicator */}
            <View style={styles.dotRow}>
                <View style={[styles.dot, {
                    backgroundColor: activeIndex === 0 ? colors.tint : colors.border,
                    width: activeIndex === 0 ? 18 : 6,
                }]} />
                <View style={[styles.dot, {
                    backgroundColor: activeIndex === 1 ? colors.tint : colors.border,
                    width: activeIndex === 1 ? 18 : 6,
                }]} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        marginTop: 8,
        marginBottom: 8,
    },
    card: {
        borderRadius: 24,
        paddingTop: 28,
        paddingBottom: 20,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    cardLabel: {
        fontSize: 11,
        fontFamily: 'Outfit_600SemiBold',
        letterSpacing: 2,
        marginBottom: 8,
    },
    cardAmount: {
        fontSize: 40,
        fontFamily: 'DMSerifDisplay_400Regular',
        letterSpacing: -0.5,
        marginBottom: 10,
    },
    trendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 20,
    },
    trendText: {
        fontSize: 14,
        fontFamily: 'Outfit_600SemiBold',
    },
    trendSecondary: {
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        borderTopWidth: 1,
        paddingTop: 16,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    statDivider: {
        width: 1,
        height: 28,
    },
    statLabel: {
        fontSize: 11,
        fontFamily: 'Outfit_500Medium',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    statValue: {
        fontSize: 17,
        fontFamily: 'Outfit_600SemiBold',
        letterSpacing: -0.3,
    },
    dotRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 5,
        marginTop: 10,
    },
    dot: {
        height: 6,
        borderRadius: 3,
    },
});
