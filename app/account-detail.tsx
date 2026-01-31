import React, { useState, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    Modal,
    TextInput,
    Alert,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
    getAllAccounts,
    getTransactionsByAccount,
    updateAccount,
    deleteAccount,
    getAllCategories
} from '@/database';
import { Account, Transaction, Category } from '@/types';
import { TransactionItem } from '@/components/TransactionItem';

export default function AccountDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const [account, setAccount] = useState<Account | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [showSettings, setShowSettings] = useState(false);
    const [showEditName, setShowEditName] = useState(false);
    const [editName, setEditName] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(async () => {
        if (!id) return;

        const [accounts, txns, cats] = await Promise.all([
            getAllAccounts(),
            getTransactionsByAccount(id),
            getAllCategories(),
        ]);

        const foundAccount = accounts.find(a => a.id === id);
        setAccount(foundAccount || null);
        setTransactions(txns);
        setCategories(cats);

        if (foundAccount) {
            setEditName(foundAccount.name);
        }
    }, [id]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const getCategoryById = (categoryId: string) =>
        categories.find(c => c.id === categoryId);

    const handleBack = () => {
        router.back();
    };

    const handleRename = async () => {
        if (!account || !editName.trim()) return;

        await updateAccount(account.id, { name: editName.trim() });
        setShowEditName(false);
        setShowSettings(false);
        await loadData();
    };

    const handleDelete = () => {
        if (!account) return;

        Alert.alert(
            'Hesabı Sil',
            `"${account.name}" hesabını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteAccount(account.id);
                        router.back();
                    },
                },
            ]
        );
    };

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: account?.currency || 'TRY',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getAccountIcon = () => {
        if (!account) return 'wallet-outline';
        if (account.name.toLowerCase().includes('nakit')) return 'cash-outline';
        if (account.name.toLowerCase().includes('yatırım')) return 'trending-up-outline';
        return 'wallet-outline';
    };

    // Calculate account statistics
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    if (!account) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>
                <View style={styles.loadingContainer}>
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                        Hesap bulunamadı
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={[styles.headerButton, { backgroundColor: colors.surface }]}
                    onPress={handleBack}
                >
                    <Ionicons name="arrow-back" size={22} color={colors.text} />
                </TouchableOpacity>

                <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
                    {account.name}
                </Text>

                <TouchableOpacity
                    style={[styles.headerButton, { backgroundColor: colors.surface }]}
                    onPress={() => setShowSettings(true)}
                >
                    <Ionicons name="settings-outline" size={22} color={colors.text} />
                </TouchableOpacity>
            </View>

            {/* Account Summary Card */}
            <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.iconContainer, { backgroundColor: colors.tint + '15' }]}>
                    <Ionicons name={getAccountIcon()} size={32} color={colors.tint} />
                </View>

                <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Mevcut Bakiye</Text>
                <Text style={[styles.balanceAmount, { color: colors.text }]}>
                    {formatAmount(account.balance)}
                </Text>

                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <View style={[styles.statIcon, { backgroundColor: colors.income + '15' }]}>
                            <Ionicons name="arrow-down" size={16} color={colors.income} />
                        </View>
                        <View>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Toplam Gelir</Text>
                            <Text style={[styles.statAmount, { color: colors.income }]}>
                                {formatAmount(totalIncome)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.statItem}>
                        <View style={[styles.statIcon, { backgroundColor: colors.expense + '15' }]}>
                            <Ionicons name="arrow-up" size={16} color={colors.expense} />
                        </View>
                        <View>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Toplam Gider</Text>
                            <Text style={[styles.statAmount, { color: colors.expense }]}>
                                {formatAmount(totalExpense)}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Transactions List */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                İŞLEMLER ({transactions.length})
            </Text>

            <FlatList
                data={transactions}
                keyExtractor={(item) => item.id}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
                }
                renderItem={({ item }) => (
                    <TransactionItem
                        transaction={item}
                        category={getCategoryById(item.category_id)}
                    />
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="receipt-outline" size={48} color={colors.border} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            Bu hesapta henüz işlem yok
                        </Text>
                    </View>
                }
                contentContainerStyle={styles.listContent}
            />

            {/* Settings Modal */}
            <Modal
                visible={showSettings}
                transparent
                animationType="fade"
                onRequestClose={() => setShowSettings(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowSettings(false)}
                >
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Hesap Ayarları</Text>

                        <TouchableOpacity
                            style={[styles.modalOption, { borderColor: colors.border }]}
                            onPress={() => {
                                setShowSettings(false);
                                setShowEditName(true);
                            }}
                        >
                            <Ionicons name="pencil-outline" size={22} color={colors.tint} />
                            <Text style={[styles.modalOptionText, { color: colors.text }]}>
                                Hesap Adını Değiştir
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.modalOption, { borderColor: colors.border }]}
                            onPress={() => {
                                setShowSettings(false);
                                handleDelete();
                            }}
                        >
                            <Ionicons name="trash-outline" size={22} color={colors.expense} />
                            <Text style={[styles.modalOptionText, { color: colors.expense }]}>
                                Hesabı Sil
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.modalCancelButton}
                            onPress={() => setShowSettings(false)}
                        >
                            <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>
                                İptal
                            </Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Edit Name Modal */}
            <Modal
                visible={showEditName}
                transparent
                animationType="fade"
                onRequestClose={() => setShowEditName(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowEditName(false)}
                >
                    <View
                        style={[styles.modalContent, { backgroundColor: colors.surface }]}
                        onStartShouldSetResponder={() => true}
                    >
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Hesap Adını Değiştir</Text>

                        <TextInput
                            style={[
                                styles.editInput,
                                {
                                    backgroundColor: colors.background,
                                    color: colors.text,
                                    borderColor: colors.border
                                }
                            ]}
                            value={editName}
                            onChangeText={setEditName}
                            placeholder="Hesap adı"
                            placeholderTextColor={colors.textSecondary}
                            autoFocus
                        />

                        <View style={styles.editButtonsRow}>
                            <TouchableOpacity
                                style={[styles.editButton, { borderColor: colors.border }]}
                                onPress={() => setShowEditName(false)}
                            >
                                <Text style={[styles.editButtonText, { color: colors.textSecondary }]}>
                                    İptal
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.editButton, { backgroundColor: colors.tint }]}
                                onPress={handleRename}
                            >
                                <Text style={[styles.editButtonText, { color: '#FFFFFF' }]}>
                                    Kaydet
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
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
    },
    headerButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        marginHorizontal: 12,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
    },
    summaryCard: {
        marginHorizontal: 16,
        marginTop: 8,
        borderRadius: 20,
        borderWidth: 1,
        padding: 24,
        alignItems: 'center',
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    balanceLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    balanceAmount: {
        fontSize: 36,
        fontWeight: '700',
        marginTop: 4,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginTop: 24,
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: 'rgba(128, 128, 128, 0.1)',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    statIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    statAmount: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 2,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        marginHorizontal: 20,
        marginTop: 28,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    listContent: {
        paddingBottom: 24,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 48,
        gap: 12,
    },
    emptyText: {
        fontSize: 15,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    modalContent: {
        width: '100%',
        borderRadius: 20,
        padding: 24,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 24,
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    modalOptionText: {
        fontSize: 16,
        fontWeight: '500',
    },
    modalCancelButton: {
        alignItems: 'center',
        paddingVertical: 16,
        marginTop: 8,
    },
    modalCancelText: {
        fontSize: 16,
        fontWeight: '500',
    },
    editInput: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        marginBottom: 20,
    },
    editButtonsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    editButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    editButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
});
