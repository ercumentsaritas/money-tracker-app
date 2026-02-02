import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
    const isDark = colorScheme === 'dark';

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: account.currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getIcon = (): { name: keyof typeof Ionicons.glyphMap; gradient: [string, string] } => {
        const name = account.name.toLowerCase();
        if (name.includes('nakit')) return { name: 'cash', gradient: ['#10B981', '#34D399'] };
        if (name.includes('yatırım')) return { name: 'trending-up', gradient: ['#8B5CF6', '#A78BFA'] };
        if (name.includes('kredi')) return { name: 'card', gradient: ['#F59E0B', '#FBBF24'] };
        return { name: 'wallet', gradient: ['#6366F1', '#818CF8'] };
    };

    const { name: iconName, gradient } = getIcon();
    const isPositive = account.balance >= 0;

    return (
        <TouchableOpacity
            style={[
                styles.container,
                {
                    backgroundColor: colors.surface,
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                }
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {/* Icon with gradient */}
            <LinearGradient
                colors={gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconContainer}
            >
                <Ionicons name={iconName} size={22} color="#FFFFFF" />
            </LinearGradient>

            {/* Content */}
            <View style={styles.content}>
                <Text style={[styles.name, { color: colors.text }]}>{account.name}</Text>
                <View style={styles.balanceRow}>
                    <Text style={[
                        styles.balance,
                        { color: isPositive ? colors.income : colors.expense }
                    ]}>
                        {formatAmount(account.balance)}
                    </Text>
                    {!isPositive && (
                        <View style={[styles.negativeBadge, { backgroundColor: colors.expense + '15' }]}>
                            <Text style={[styles.negativeText, { color: colors.expense }]}>Negatif</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Arrow */}
            <View style={[styles.arrowContainer, { backgroundColor: colors.surfaceAlt }]}>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
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
    name: {
        fontSize: 15,
        fontWeight: '600',
        letterSpacing: -0.2,
    },
    balanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 8,
    },
    balance: {
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    negativeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    negativeText: {
        fontSize: 10,
        fontWeight: '600',
    },
    arrowContainer: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
