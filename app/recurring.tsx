import React, { useState, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    Alert,
    Modal,
    TextInput,
    ScrollView,
    TouchableWithoutFeedback,
    Keyboard,
    Switch,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { RecurringTransaction, RecurringTransactionInput, Category, Account, TransactionType } from '@/types';
import {
    getAllRecurringTransactions,
    addRecurringTransaction,
    deleteRecurringTransaction,
    getAllCategories,
    getAllAccounts,
    initDatabase,
} from '@/database';
import { CalendarPicker } from '@/components/CalendarPicker';

type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export default function RecurringScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const [transactions, setTransactions] = useState<RecurringTransaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showCalendarPicker, setShowCalendarPicker] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<TransactionType>('expense');
    const [frequency, setFrequency] = useState<Frequency>('monthly');
    const [dayOfMonth, setDayOfMonth] = useState<number>(1); // Default to 1st of month
    const [selectedCategoryId, setSelectedCategoryId] = useState('');

    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [reminderEnabled, setReminderEnabled] = useState(false);

    const loadData = useCallback(async () => {
        await initDatabase();
        const [recurring, cats, accs] = await Promise.all([
            getAllRecurringTransactions(),
            getAllCategories(),
            getAllAccounts(),
        ]);
        setTransactions(recurring);
        setCategories(cats);
        setAccounts(accs);
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const resetForm = () => {
        setName('');
        setAmount('');
        setType('expense');
        setFrequency('monthly');
        setDayOfMonth(1);
        setSelectedCategoryId('');
        setSelectedAccountId('');
        setReminderEnabled(false);
    };

    const handleAddRecurring = async () => {
        if (!name.trim()) {
            Alert.alert('Hata', 'Lütfen bir isim girin');
            return;
        }
        if (!amount || parseFloat(amount) <= 0) {
            Alert.alert('Hata', 'Lütfen geçerli bir tutar girin');
            return;
        }
        if (!selectedCategoryId) {
            Alert.alert('Hata', 'Lütfen bir kategori seçin');
            return;
        }
        if (!selectedAccountId) {
            Alert.alert('Hata', 'Lütfen bir hesap seçin');
            return;
        }

        try {
            // Calculate next_date based on frequency and day_of_month
            const now = new Date();
            let nextDate = new Date();

            if (frequency === 'monthly' || frequency === 'yearly') {
                // Set to the selected day of current or next month
                nextDate.setDate(dayOfMonth);

                // If the day has already passed this month, move to next month/year
                if (nextDate < now) {
                    if (frequency === 'monthly') {
                        nextDate.setMonth(nextDate.getMonth() + 1);
                    } else {
                        nextDate.setFullYear(nextDate.getFullYear() + 1);
                    }
                }
            }

            const input: RecurringTransactionInput = {
                name: name.trim(),
                amount: parseFloat(amount),
                type,
                category_id: selectedCategoryId,
                account_id: selectedAccountId,
                frequency,
                day_of_month: (frequency === 'monthly' || frequency === 'yearly') ? dayOfMonth : undefined,
                next_date: nextDate.toISOString(),
                reminder_enabled: reminderEnabled,
            };
            await addRecurringTransaction(input);
            setShowAddModal(false);
            resetForm();
            loadData();
        } catch (error) {
            console.error('Failed to add recurring transaction:', error);
            Alert.alert('Hata', 'İşlem eklenemedi');
        }
    };

    const handleDeleteRecurring = (item: RecurringTransaction) => {
        Alert.alert(
            'İşlemi Sil',
            `"${item.name}" işlemini silmek istediğinizden emin misiniz?`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteRecurringTransaction(item.id);
                        loadData();
                    },
                },
            ]
        );
    };

    const getFrequencyLabel = (freq: string) => {
        switch (freq) {
            case 'daily': return 'Günlük';
            case 'weekly': return 'Haftalık';
            case 'monthly': return 'Aylık';
            case 'yearly': return 'Yıllık';
            default: return freq;
        }
    };

    const formatAmount = (amt: number, t: string) => {
        const formatted = new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 0,
        }).format(amt);
        return t === 'income' ? `+${formatted}` : `-${formatted}`;
    };

    const getCategoryById = (id: string): Category => {
        const category = categories.find(c => c.id === id);
        // Return fallback category if not found (deleted category case)
        return category ?? {
            id: 'unknown',
            name: 'Bilinmeyen',
            type: 'expense',
            icon: 'help-circle',
            color: '#999999'
        };
    };

    const filteredCategories = categories.filter(c => c.type === type);

    const openAddModal = () => {
        resetForm();
        if (accounts.length > 0) {
            setSelectedAccountId(accounts[0].id);
        }
        setShowAddModal(true);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Tekrarlayan İşlemler</Text>
                <TouchableOpacity onPress={openAddModal}>
                    <Ionicons name="add" size={24} color={colors.tint} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={transactions}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => {
                    const category = getCategoryById(item.category_id);
                    return (
                        <TouchableOpacity
                            style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}
                            onLongPress={() => handleDeleteRecurring(item)}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: item.type === 'income' ? colors.income + '15' : colors.expense + '15' }]}>
                                <Ionicons
                                    name={category?.icon as any || (item.type === 'income' ? 'trending-up' : 'trending-down')}
                                    size={22}
                                    color={item.type === 'income' ? colors.income : colors.expense}
                                />
                            </View>
                            <View style={styles.itemContent}>
                                <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                                <Text style={[styles.itemFreq, { color: colors.textSecondary }]}>
                                    {getFrequencyLabel(item.frequency)}
                                    {item.day_of_month && (item.frequency === 'monthly' || item.frequency === 'yearly')
                                        ? ` - Her ayın ${item.day_of_month}. günü`
                                        : ''}
                                </Text>
                            </View>
                            <Text style={[styles.itemAmount, { color: item.type === 'income' ? colors.income : colors.expense }]}>
                                {formatAmount(item.amount, item.type)}
                            </Text>
                        </TouchableOpacity>
                    );
                }}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="repeat-outline" size={64} color={colors.textSecondary} style={{ opacity: 0.5 }} />
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>Tekrarlayan İşlem Yok</Text>
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            Maaş, kira, faturalar gibi{'\n'}düzenli işlemlerinizi buradan yönetin
                        </Text>
                        <TouchableOpacity
                            style={[styles.addButton, { backgroundColor: colors.tint }]}
                            onPress={openAddModal}
                        >
                            <Ionicons name="add" size={20} color="#FFFFFF" />
                            <Text style={styles.addButtonText}>İşlem Ekle</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            {/* Add Modal */}
            <Modal visible={showAddModal} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setShowAddModal(false)}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                    <KeyboardAvoidingView
                        style={styles.modalOverlay}
                        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : (StatusBar.currentHeight || 0)}
                    >
                        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, { color: colors.text }]}>Yeni Tekrarlayan İşlem</Text>
                                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                                    <Ionicons name="close" size={24} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                                {/* Type Selector */}
                                <View style={styles.typeSelector}>
                                    <TouchableOpacity
                                        style={[
                                            styles.typeButton,
                                            type === 'expense' && { backgroundColor: colors.expense + '15', borderColor: colors.expense },
                                        ]}
                                        onPress={() => { setType('expense'); setSelectedCategoryId(''); }}
                                    >
                                        <Text style={[styles.typeText, { color: type === 'expense' ? colors.expense : colors.textSecondary }]}>
                                            Gider
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.typeButton,
                                            type === 'income' && { backgroundColor: colors.income + '15', borderColor: colors.income },
                                        ]}
                                        onPress={() => { setType('income'); setSelectedCategoryId(''); }}
                                    >
                                        <Text style={[styles.typeText, { color: type === 'income' ? colors.income : colors.textSecondary }]}>
                                            Gelir
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Name Input */}
                                <Text style={[styles.label, { color: colors.textSecondary }]}>İsim</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                    placeholder="Örn: Aylık Kira"
                                    placeholderTextColor={colors.textSecondary}
                                    value={name}
                                    onChangeText={setName}
                                />

                                {/* Amount Input */}
                                <Text style={[styles.label, { color: colors.textSecondary }]}>Tutar</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                    placeholder="₺0"
                                    placeholderTextColor={colors.textSecondary}
                                    value={amount}
                                    onChangeText={setAmount}
                                    keyboardType="numeric"
                                />

                                {/* Frequency Selector */}
                                <Text style={[styles.label, { color: colors.textSecondary }]}>Sıklık</Text>
                                <View style={styles.frequencySelector}>
                                    {(['daily', 'weekly', 'monthly', 'yearly'] as Frequency[]).map((f) => (
                                        <TouchableOpacity
                                            key={f}
                                            style={[
                                                styles.frequencyButton,
                                                { borderColor: colors.border },
                                                frequency === f && { backgroundColor: colors.tint + '15', borderColor: colors.tint },
                                            ]}
                                            onPress={() => setFrequency(f)}
                                        >
                                            <Text style={[styles.frequencyText, { color: frequency === f ? colors.tint : colors.textSecondary }]}>
                                                {getFrequencyLabel(f)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Day of Month Selector - Only show for monthly/yearly */}
                                {(frequency === 'monthly' || frequency === 'yearly') && (
                                    <>
                                        <Text style={[styles.label, { color: colors.textSecondary }]}>
                                            Ayın Hangi Günü
                                        </Text>
                                        <TouchableOpacity
                                            style={[
                                                styles.calendarButton,
                                                { backgroundColor: colors.background, borderColor: colors.border }
                                            ]}
                                            onPress={() => setShowCalendarPicker(true)}
                                        >
                                            <Ionicons name="calendar-outline" size={20} color={colors.tint} />
                                            <Text style={[styles.calendarButtonText, { color: colors.text }]}>
                                                {dayOfMonth}. gün
                                            </Text>
                                            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                                        </TouchableOpacity>
                                    </>
                                )}

                                {/* Category Selector */}
                                <Text style={[styles.label, { color: colors.textSecondary }]}>Kategori</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                                    {filteredCategories.map((cat) => (
                                        <TouchableOpacity
                                            key={cat.id}
                                            style={[
                                                styles.categoryChip,
                                                { borderColor: colors.border },
                                                selectedCategoryId === cat.id && { backgroundColor: cat.color + '20', borderColor: cat.color },
                                            ]}
                                            onPress={() => setSelectedCategoryId(cat.id)}
                                        >
                                            <Ionicons name={cat.icon as any} size={16} color={selectedCategoryId === cat.id ? cat.color : colors.textSecondary} />
                                            <Text style={[styles.categoryChipText, { color: selectedCategoryId === cat.id ? cat.color : colors.text }]}>
                                                {cat.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>

                                {/* Account Selector */}
                                <Text style={[styles.label, { color: colors.textSecondary }]}>Hesap</Text>
                                <View style={styles.accountSelector}>
                                    {accounts.map((acc) => (
                                        <TouchableOpacity
                                            key={acc.id}
                                            style={[
                                                styles.accountChip,
                                                { borderColor: colors.border },
                                                selectedAccountId === acc.id && { backgroundColor: colors.tint + '15', borderColor: colors.tint },
                                            ]}
                                            onPress={() => setSelectedAccountId(acc.id)}
                                        >
                                            <Text style={[styles.accountChipText, { color: selectedAccountId === acc.id ? colors.tint : colors.text }]}>
                                                {acc.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Reminder Switch */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 8 }}>
                                    <Text style={[styles.label, { color: colors.textSecondary, marginTop: 0, marginBottom: 0 }]}>Hatırlatıcı (1 Gün Önce)</Text>
                                    <Switch
                                        value={reminderEnabled}
                                        onValueChange={setReminderEnabled}
                                        trackColor={{ false: colors.border, true: colors.tint }}
                                        thumbColor={'#fff'}
                                    />
                                </View>

                                {/* Submit Button */}
                                <TouchableOpacity
                                    style={[styles.submitButton, { backgroundColor: colors.tint }]}
                                    onPress={handleAddRecurring}
                                >
                                    <Text style={styles.submitButtonText}>Ekle</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </KeyboardAvoidingView>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Calendar Picker Modal */}
            <CalendarPicker
                visible={showCalendarPicker}
                selectedDate={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}`}
                onDateSelect={(date) => {
                    const day = parseInt(date.split('-')[2]);
                    setDayOfMonth(day);
                }}
                onClose={() => setShowCalendarPicker(false)}
            />
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    typeSelector: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    typeButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'transparent',
        alignItems: 'center',
    },
    typeText: {
        fontSize: 15,
        fontWeight: '500',
    },
    label: {
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
    },
    frequencySelector: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    frequencyButton: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
    },
    frequencyText: {
        fontSize: 13,
        fontWeight: '500',
    },
    daySelector: {
        marginBottom: 8,
    },
    daySelectorContent: {
        gap: 8,
        paddingRight: 8,
    },
    dayButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayText: {
        fontSize: 14,
        fontWeight: '500',
    },
    categoryScroll: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        marginRight: 8,
    },
    categoryChipText: {
        fontSize: 13,
    },
    accountSelector: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    accountChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
    },
    accountChipText: {
        fontSize: 13,
        fontWeight: '500',
    },
    submitButton: {
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 20,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    calendarButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    calendarButtonText: {
        flex: 1,
        fontSize: 15,
        marginLeft: 12,
        fontWeight: '500',
    },
});
