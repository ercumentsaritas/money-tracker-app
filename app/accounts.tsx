import React, { useState, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    TextInput,
    Modal,
    Alert,
    Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getAllAccounts, addAccount, deleteAccount, initDatabase } from '@/database';
import { Account } from '@/types';

export default function AccountsScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const [accounts, setAccounts] = useState<Account[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newAccountName, setNewAccountName] = useState('');
    const [adding, setAdding] = useState(false);

    const loadAccounts = useCallback(async () => {
        await initDatabase();
        const accs = await getAllAccounts();
        setAccounts(accs);
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadAccounts();
        }, [loadAccounts])
    );

    const handleAddAccount = async () => {
        if (!newAccountName.trim()) return;

        setAdding(true);
        try {
            await addAccount({
                name: newAccountName.trim(),
                balance: 0,
                currency: 'TRY',
            });
            setNewAccountName('');
            setShowAddModal(false);
            loadAccounts();
        } catch (error) {
            console.error('Failed to add account:', error);
            Alert.alert('Hata', 'Hesap eklenemedi');
        } finally {
            setAdding(false);
        }
    };

    const handleDeleteAccount = (account: Account) => {
        Alert.alert(
            'Hesabı Sil',
            `"${account.name}" hesabını silmek istediğinizden emin misiniz?`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteAccount(account.id);
                        loadAccounts();
                    },
                },
            ]
        );
    };

    const getIcon = (name: string) => {
        if (name.toLowerCase().includes('nakit')) return 'cash-outline';
        if (name.toLowerCase().includes('yatırım')) return 'trending-up-outline';
        if (name.toLowerCase().includes('banka')) return 'card-outline';
        return 'wallet-outline';
    };

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Hesaplar</Text>
                <TouchableOpacity onPress={() => setShowAddModal(true)}>
                    <Ionicons name="add" size={24} color={colors.tint} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={accounts}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[styles.accountItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        onLongPress={() => handleDeleteAccount(item)}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: colors.tint + '15' }]}>
                            <Ionicons name={getIcon(item.name)} size={22} color={colors.tint} />
                        </View>
                        <View style={styles.accountInfo}>
                            <Text style={[styles.accountName, { color: colors.text }]}>{item.name}</Text>
                            <Text style={[styles.accountBalance, { color: colors.textSecondary }]}>
                                {formatAmount(item.balance)}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            Henüz hesap yok
                        </Text>
                    </View>
                }
            />

            {/* Add Modal */}
            <Modal visible={showAddModal} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setShowAddModal(false)}>
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => {
                        Keyboard.dismiss();
                        setShowAddModal(false);
                    }}
                >
                    <View
                        style={[styles.modalContent, { backgroundColor: colors.surface }]}
                        onStartShouldSetResponder={() => true}
                    >
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Yeni Hesap</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                            placeholder="Hesap adı"
                            placeholderTextColor={colors.textSecondary}
                            value={newAccountName}
                            onChangeText={setNewAccountName}
                            autoFocus
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: colors.surfaceAlt }]}
                                onPress={() => setShowAddModal(false)}
                                disabled={adding}
                            >
                                <Text style={[styles.modalButtonText, { color: colors.text }]}>İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: colors.tint, opacity: adding ? 0.6 : 1 }]}
                                onPress={handleAddAccount}
                                disabled={adding}
                            >
                                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                                    {adding ? 'Ekleniyor...' : 'Ekle'}
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
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
    },
    list: {
        padding: 16,
    },
    accountItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 10,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    accountInfo: {
        flex: 1,
        marginLeft: 14,
    },
    accountName: {
        fontSize: 16,
        fontWeight: '500',
    },
    accountBalance: {
        fontSize: 14,
        marginTop: 2,
    },
    empty: {
        alignItems: 'center',
        paddingVertical: 48,
    },
    emptyText: {
        fontSize: 15,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        borderRadius: 20,
        padding: 24,
        width: '85%',
        maxWidth: 340,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
});
