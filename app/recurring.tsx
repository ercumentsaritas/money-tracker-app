import React, { useState, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    Alert,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface RecurringTransaction {
    id: string;
    name: string;
    amount: number;
    type: 'income' | 'expense';
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    nextDate: string;
}

// Placeholder data - in future this would come from database
const SAMPLE_RECURRING: RecurringTransaction[] = [];

export default function RecurringScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const [transactions, setTransactions] = useState<RecurringTransaction[]>(SAMPLE_RECURRING);

    const getFrequencyLabel = (freq: string) => {
        switch (freq) {
            case 'daily': return 'Günlük';
            case 'weekly': return 'Haftalık';
            case 'monthly': return 'Aylık';
            case 'yearly': return 'Yıllık';
            default: return freq;
        }
    };

    const formatAmount = (amount: number, type: string) => {
        const formatted = new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 0,
        }).format(amount);
        return type === 'income' ? `+${formatted}` : `-${formatted}`;
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Tekrarlayan İşlemler</Text>
                <TouchableOpacity onPress={() => Alert.alert('Yakında', 'Bu özellik yakında eklenecek.')}>
                    <Ionicons name="add" size={24} color={colors.tint} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={transactions}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <View style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={[styles.iconContainer, { backgroundColor: item.type === 'income' ? colors.income + '15' : colors.expense + '15' }]}>
                            <Ionicons
                                name={item.type === 'income' ? 'trending-up' : 'trending-down'}
                                size={22}
                                color={item.type === 'income' ? colors.income : colors.expense}
                            />
                        </View>
                        <View style={styles.itemContent}>
                            <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                            <Text style={[styles.itemFreq, { color: colors.textSecondary }]}>
                                {getFrequencyLabel(item.frequency)}
                            </Text>
                        </View>
                        <Text style={[styles.itemAmount, { color: item.type === 'income' ? colors.income : colors.expense }]}>
                            {formatAmount(item.amount, item.type)}
                        </Text>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="repeat-outline" size={64} color={colors.textSecondary} style={{ opacity: 0.5 }} />
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>Tekrarlayan İşlem Yok</Text>
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            Maaş, kira, faturalar gibi{'\n'}düzenli işlemlerinizi buradan yönetin
                        </Text>
                        <TouchableOpacity
                            style={[styles.addButton, { backgroundColor: colors.tint }]}
                            onPress={() => Alert.alert('Yakında', 'Bu özellik yakında eklenecek.')}
                        >
                            <Ionicons name="add" size={20} color="#FFFFFF" />
                            <Text style={styles.addButtonText}>İşlem Ekle</Text>
                        </TouchableOpacity>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
    },
    list: {
        padding: 16,
        flexGrow: 1,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 8,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemContent: {
        flex: 1,
        marginLeft: 14,
    },
    itemName: {
        fontSize: 15,
        fontWeight: '500',
    },
    itemFreq: {
        fontSize: 13,
        marginTop: 2,
    },
    itemAmount: {
        fontSize: 15,
        fontWeight: '600',
    },
    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 20,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 22,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 24,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
});
