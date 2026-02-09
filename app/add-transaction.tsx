import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Modal,
    TouchableWithoutFeedback,
    Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { addTransaction, getCategoriesByType, getAllAccounts } from '@/database';
import { Category, Account, TransactionType } from '@/types';
import { AddCategoryModal } from '@/components/AddCategoryModal';
import { CalendarPicker } from '@/components/CalendarPicker';

export default function AddTransactionScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const [type, setType] = useState<TransactionType>('expense');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, [type]);

    const loadData = async () => {
        const cats = await getCategoriesByType(type);
        const accs = await getAllAccounts();
        setCategories(cats);
        setAccounts(accs);
        setSelectedCategory(cats[0] || null);
        setSelectedAccount(accs[0] || null);
    };

    const handleSave = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            Alert.alert('Hata', 'Lütfen geçerli bir tutar girin');
            return;
        }
        if (!selectedCategory) {
            Alert.alert('Hata', 'Lütfen kategori seçin');
            return;
        }
        if (!selectedAccount) {
            Alert.alert('Hata', 'Lütfen hesap seçin');
            return;
        }

        setSaving(true);
        try {
            await addTransaction({
                type,
                amount: parseFloat(amount),
                category_id: selectedCategory.id,
                account_id: selectedAccount.id,
                description: description.trim(),
                date: date,
            });
            router.back();
        } catch (error) {
            console.error('Failed to add transaction:', error);
            Alert.alert('Hata', 'İşlem kaydedilemedi');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <KeyboardAvoidingView
                    style={styles.keyboardView}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <TouchableOpacity onPress={() => router.back()}>
                            <Ionicons name="close" size={28} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>Yeni İşlem</Text>
                        <TouchableOpacity onPress={handleSave} disabled={saving}>
                            <Text style={[styles.saveButton, { color: colors.tint, opacity: saving ? 0.5 : 1 }]}>
                                {saving ? 'Kaydediliyor...' : 'Kaydet'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                        {/* Type selector */}
                        <View style={styles.typeRow}>
                            <TouchableOpacity
                                style={[
                                    styles.typeButton,
                                    {
                                        backgroundColor: type === 'expense' ? colors.expense : colors.surface,
                                        borderColor: type === 'expense' ? colors.expense : colors.border,
                                    },
                                ]}
                                onPress={() => setType('expense')}
                            >
                                <Ionicons
                                    name="arrow-up"
                                    size={20}
                                    color={type === 'expense' ? '#FFF' : colors.text}
                                />
                                <Text style={[styles.typeText, { color: type === 'expense' ? '#FFF' : colors.text }]}>
                                    Gider
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.typeButton,
                                    {
                                        backgroundColor: type === 'income' ? colors.income : colors.surface,
                                        borderColor: type === 'income' ? colors.income : colors.border,
                                    },
                                ]}
                                onPress={() => setType('income')}
                            >
                                <Ionicons
                                    name="arrow-down"
                                    size={20}
                                    color={type === 'income' ? '#FFF' : colors.text}
                                />
                                <Text style={[styles.typeText, { color: type === 'income' ? '#FFF' : colors.text }]}>
                                    Gelir
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Amount input */}
                        <View style={styles.amountContainer}>
                            <Text style={[styles.currencySymbol, { color: type === 'income' ? colors.income : colors.expense }]}>
                                ₺
                            </Text>
                            <TextInput
                                style={[styles.amountInput, { color: colors.text }]}
                                value={amount}
                                onChangeText={setAmount}
                                placeholder="0"
                                placeholderTextColor={colors.textSecondary}
                                keyboardType="decimal-pad"
                                autoFocus
                            />
                        </View>

                        {/* Description input */}
                        <View style={[styles.inputCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Açıklama</Text>
                            <TextInput
                                style={[styles.textInput, { color: colors.text }]}
                                value={description}
                                onChangeText={setDescription}
                                placeholder="İşlem açıklaması (isteğe bağlı)"
                                placeholderTextColor={colors.textSecondary}
                            />
                        </View>

                        {/* Date input */}
                        <View style={[styles.inputCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Tarih</Text>
                            <TouchableOpacity
                                style={styles.dateButton}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Ionicons name="calendar-outline" size={18} color={colors.tint} />
                                <Text style={[styles.dateText, { color: colors.text }]}>
                                    {new Date(date).toLocaleDateString('tr-TR', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Calendar Picker */}
                        <CalendarPicker
                            visible={showDatePicker}
                            selectedDate={date}
                            onDateSelect={setDate}
                            onClose={() => setShowDatePicker(false)}
                        />

                        {/* Category selector */}
                        <View style={[styles.inputCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Kategori</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                                {categories.map((cat) => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[
                                            styles.categoryChip,
                                            {
                                                backgroundColor: selectedCategory?.id === cat.id ? cat.color + '20' : 'transparent',
                                                borderColor: selectedCategory?.id === cat.id ? cat.color : colors.border,
                                            },
                                        ]}
                                        onPress={() => setSelectedCategory(cat)}
                                    >
                                        <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                                        <Text
                                            style={[
                                                styles.categoryText,
                                                { color: selectedCategory?.id === cat.id ? cat.color : colors.text },
                                            ]}
                                        >
                                            {cat.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                                {/* Add Category Button */}
                                <TouchableOpacity
                                    style={[
                                        styles.categoryChip,
                                        styles.addCategoryChip,
                                        { borderColor: colors.tint, borderStyle: 'dashed' },
                                    ]}
                                    onPress={() => setShowCategoryModal(true)}
                                >
                                    <Ionicons name="add" size={16} color={colors.tint} />
                                    <Text style={[styles.categoryText, { color: colors.tint }]}>Yeni</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>

                        {/* Account selector */}
                        <View style={[styles.inputCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Hesap</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                                {accounts.map((acc) => (
                                    <TouchableOpacity
                                        key={acc.id}
                                        style={[
                                            styles.categoryChip,
                                            {
                                                backgroundColor: selectedAccount?.id === acc.id ? colors.tint + '20' : 'transparent',
                                                borderColor: selectedAccount?.id === acc.id ? colors.tint : colors.border,
                                            },
                                        ]}
                                        onPress={() => setSelectedAccount(acc)}
                                    >
                                        <Ionicons
                                            name="wallet-outline"
                                            size={16}
                                            color={selectedAccount?.id === acc.id ? colors.tint : colors.text}
                                        />
                                        <Text
                                            style={[
                                                styles.categoryText,
                                                { color: selectedAccount?.id === acc.id ? colors.tint : colors.text },
                                            ]}
                                        >
                                            {acc.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </ScrollView>

                    <AddCategoryModal
                        visible={showCategoryModal}
                        onClose={() => setShowCategoryModal(false)}
                        onCategoryAdded={loadData}
                        type={type}
                    />
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    saveButton: {
        fontSize: 14,
        fontWeight: '500',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
    },
    typeRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    typeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
    },
    typeText: {
        fontSize: 14,
        fontWeight: '500',
    },
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    currencySymbol: {
        fontSize: 48,
        fontWeight: '300',
    },
    amountInput: {
        fontSize: 56,
        fontWeight: '300',
        minWidth: 100,
        textAlign: 'center',
    },
    inputCard: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        marginBottom: 12,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    textInput: {
        fontSize: 16,
    },
    categoryScroll: {
        marginTop: 4,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 8,
        gap: 6,
    },
    categoryDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    categoryText: {
        fontSize: 13,
        fontWeight: '500',
    },
    addCategoryChip: {
        borderStyle: 'dashed',
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dateText: {
        fontSize: 16,
    },
    dateModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateModalContent: {
        borderRadius: 16,
        padding: 20,
        minWidth: 280,
    },
    dateModalTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
        textAlign: 'center',
    },
    dateModalInput: {
        fontSize: 16,
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 16,
        textAlign: 'center',
    },
    dateModalButton: {
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    dateModalButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
});
