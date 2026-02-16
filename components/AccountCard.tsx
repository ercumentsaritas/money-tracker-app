import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Money, TrendUp, CreditCard, Wallet, CaretRight } from 'phosphor-react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Account } from '@/types';

interface AccountCardProps {
    account: Account;
    onPress?: () => void;
}

export function AccountCard({ account, onPress }: AccountCardProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const isDark = colorScheme === 'dark';

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: account.currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getIcon = () => {
        const name = account.name.toLowerCase();
        if (name.includes('nakit')) return Money;
        if (name.includes('yatırım')) return TrendUp;
        if (name.includes('kredi')) return CreditCard;
        return Wallet;
    };

    const Icon = getIcon();
    const isPositive = account.balance >= 0;

    return (
        <TouchableOpacity
            style={[styles.container, { borderBottomColor: colors.border }]}
            onPress={onPress}
            activeOpacity={0.6}
        >
            {/* Icon */}
            <View style={[styles.iconContainer, {
                backgroundColor: isDark ? 'rgba(143, 174, 139, 0.12)' : 'rgba(91, 111, 91, 0.08)'
            }]}>
                <Icon size={20} color={colors.tint} weight="light" />
            </View>

            {/* Content */}
            <View style={styles.content}>
                <Text style={[styles.name, { color: colors.text }]}>{account.name}</Text>
                <Text style={[
                    styles.balance,
                    { color: isPositive ? colors.income : colors.expense }
                ]}>
                    {formatAmount(account.balance)}
                </Text>
            </View>

            {/* Arrow */}
            <CaretRight size={16} color={colors.textSecondary} weight="light" />
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
    name: {
        fontSize: 15,
        fontFamily: 'Outfit_500Medium',
        letterSpacing: -0.2,
    },
    balance: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        letterSpacing: -0.3,
        marginTop: 2,
    },
});
