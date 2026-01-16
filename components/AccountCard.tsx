import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: account.currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getIcon = () => {
        if (account.name.toLowerCase().includes('nakit')) return 'cash-outline';
        if (account.name.toLowerCase().includes('yatırım')) return 'trending-up-outline';
        return 'wallet-outline';
    };

    return (
        <TouchableOpacity
            style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.iconContainer, { backgroundColor: colors.tint + '15' }]}>
                <Ionicons name={getIcon()} size={20} color={colors.tint} />
            </View>
            <View style={styles.content}>
                <Text style={[styles.name, { color: colors.text }]}>{account.name}</Text>
                <Text style={[styles.balance, { color: colors.textSecondary }]}>
                    {formatAmount(account.balance)}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
    },
    iconContainer: {
        width: 38,
        height: 38,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        marginLeft: 12,
    },
    name: {
        fontSize: 14,
        fontWeight: '500',
    },
    balance: {
        fontSize: 13,
        marginTop: 2,
    },
});
