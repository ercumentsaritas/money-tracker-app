import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    Modal,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    TouchableWithoutFeedback,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
    ArrowLeft, Plus, Trash,
    CreditCard, House, Car, GraduationCap,
    FirstAid, ShoppingBag, Coins, DotsThree,
} from 'phosphor-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const DEBT_STORAGE_KEY = 'user_debts';

interface Debt {
    id: string;
    name: string;
    totalAmount: number;
    remainingAmount: number;
    monthlyPayment: number;
    icon: string;
}

const DEBT_ICONS: { key: string; icon: any; label: string }[] = [
    { key: 'credit-card', icon: CreditCard, label: 'Kredi Kartı' },
    { key: 'house', icon: House, label: 'Konut' },
    { key: 'car', icon: Car, label: 'Araç' },
    { key: 'education', icon: GraduationCap, label: 'Eğitim' },
    { key: 'health', icon: FirstAid, label: 'Sağlık' },
    { key: 'shopping', icon: ShoppingBag, label: 'Alışveriş' },
    { key: 'personal', icon: Coins, label: 'Bireysel' },
    { key: 'other', icon: DotsThree, label: 'Diğer' },
];

function getIconComponent(iconKey: string) {
    const found = DEBT_ICONS.find(d => d.key === iconKey);
    return found ? found.icon : CreditCard;
}

export default function DebtsScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const [debts, setDebts] = useState<Debt[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

    // Form state
    const [formName, setFormName] = useState('');
    const [formTotal, setFormTotal] = useState('');
    const [formRemaining, setFormRemaining] = useState('');
    const [formMonthly, setFormMonthly] = useState('');
    const [formIcon, setFormIcon] = useState('credit-card');

    useEffect(() => {
        loadDebts();
    }, []);

    const loadDebts = async () => {
        try {
            const data = await AsyncStorage.getItem(DEBT_STORAGE_KEY);
            if (data) {
                setDebts(JSON.parse(data));
            }
        } catch (e) {
            console.error('Failed to load debts:', e);
        }
    };

    const saveDebts = async (newDebts: Debt[]) => {
        try {
            await AsyncStorage.setItem(DEBT_STORAGE_KEY, JSON.stringify(newDebts));
            setDebts(newDebts);

            // Also update totals for BalanceCard
            const totalDebt = newDebts.reduce((sum, d) => sum + d.remainingAmount, 0);
            const totalMonthly = newDebts.reduce((sum, d) => sum + d.monthlyPayment, 0);
            await AsyncStorage.setItem('user_total_debt', totalDebt.toString());
            await AsyncStorage.setItem('user_monthly_debt_payment', totalMonthly.toString());
        } catch (e) {
            console.error('Failed to save debts:', e);
        }
    };

    const openAddModal = () => {
        setEditingDebt(null);
        setFormName('');
        setFormTotal('');
        setFormRemaining('');
        setFormMonthly('');
        setFormIcon('credit-card');
        setShowModal(true);
    };

    const openEditModal = (debt: Debt) => {
        setEditingDebt(debt);
        setFormName(debt.name);
        setFormTotal(debt.totalAmount.toString());
        setFormRemaining(debt.remainingAmount.toString());
        setFormMonthly(debt.monthlyPayment.toString());
        setFormIcon(debt.icon);
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formName.trim()) {
            Alert.alert('Hata', 'Borç adı girin');
            return;
        }

        const remaining = parseFloat(formRemaining.replace(/[^0-9.-]/g, '')) || 0;
        const total = parseFloat(formTotal.replace(/[^0-9.-]/g, '')) || remaining;
        const monthly = parseFloat(formMonthly.replace(/[^0-9.-]/g, '')) || 0;

        if (remaining <= 0) {
            Alert.alert('Hata', 'Kalan borç tutarı girin');
            return;
        }

        if (editingDebt) {
            const updated = debts.map(d =>
                d.id === editingDebt.id
                    ? { ...d, name: formName.trim(), totalAmount: total, remainingAmount: remaining, monthlyPayment: monthly, icon: formIcon }
                    : d
            );
            await saveDebts(updated);
        } else {
            const newDebt: Debt = {
                id: Date.now().toString(),
                name: formName.trim(),
                totalAmount: total,
                remainingAmount: remaining,
                monthlyPayment: monthly,
                icon: formIcon,
            };
            await saveDebts([...debts, newDebt]);
        }

        setShowModal(false);
    };

    const handleDelete = (debt: Debt) => {
        Alert.alert(
            'Borç Sil',
            `"${debt.name}" borcu silinecek. Emin misiniz?`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        const updated = debts.filter(d => d.id !== debt.id);
                        await saveDebts(updated);
                    },
                },
            ]
        );
    };

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const totalRemaining = debts.reduce((sum, d) => sum + d.remainingAmount, 0);
    const totalMonthlyPayment = debts.reduce((sum, d) => sum + d.monthlyPayment, 0);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft size={22} color={colors.text} weight="regular" />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Borçlar</Text>
                <TouchableOpacity onPress={openAddModal} style={[styles.addBtn, { backgroundColor: colors.tint + '12' }]}>
                    <Plus size={20} color={colors.tint} weight="regular" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                {/* Summary */}
                {debts.length > 0 && (
                    <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
                        <View style={styles.summaryRow}>
                            <View style={styles.summaryItem}>
                                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>TOPLAM BORÇ</Text>
                                <Text style={[styles.summaryAmount, { color: colors.expense }]}>
                                    {formatAmount(totalRemaining)}
                                </Text>
                            </View>
                            <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
                            <View style={styles.summaryItem}>
                                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>AYLIK ÖDEME</Text>
                                <Text style={[styles.summaryAmount, { color: colors.text }]}>
                                    {formatAmount(totalMonthlyPayment)}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Debt List */}
                {debts.map((debt) => {
                    const Icon = getIconComponent(debt.icon);
                    const progress = debt.totalAmount > 0
                        ? ((debt.totalAmount - debt.remainingAmount) / debt.totalAmount) * 100
                        : 0;
                    const monthsLeft = debt.monthlyPayment > 0
                        ? Math.ceil(debt.remainingAmount / debt.monthlyPayment)
                        : 0;

                    return (
                        <TouchableOpacity
                            key={debt.id}
                            style={[styles.debtCard, { backgroundColor: colors.surface }]}
                            onPress={() => openEditModal(debt)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.debtTop}>
                                <View style={[styles.debtIcon, { backgroundColor: colors.expense + '10' }]}>
                                    <Icon size={20} color={colors.expense} weight="light" />
                                </View>
                                <View style={styles.debtInfo}>
                                    <Text style={[styles.debtName, { color: colors.text }]}>{debt.name}</Text>
                                    <Text style={[styles.debtMeta, { color: colors.textSecondary }]}>
                                        {monthsLeft > 0 ? `~${monthsLeft} ay kaldı` : 'Ödeme planı yok'}
                                        {debt.monthlyPayment > 0 && ` · ${formatAmount(debt.monthlyPayment)}/ay`}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => handleDelete(debt)}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Trash size={18} color={colors.textSecondary} weight="light" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.debtBottom}>
                                <View style={styles.debtAmounts}>
                                    <Text style={[styles.debtRemaining, { color: colors.expense }]}>
                                        {formatAmount(debt.remainingAmount)}
                                    </Text>
                                    <Text style={[styles.debtTotal, { color: colors.textSecondary }]}>
                                        / {formatAmount(debt.totalAmount)}
                                    </Text>
                                </View>

                                {/* Progress bar */}
                                <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                                    <View
                                        style={[
                                            styles.progressFill,
                                            {
                                                backgroundColor: colors.income,
                                                width: `${Math.min(progress, 100)}%`,
                                            },
                                        ]}
                                    />
                                </View>
                                <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                                    {progress.toFixed(0)}% ödendi
                                </Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}

                {debts.length === 0 && (
                    <View style={styles.emptyState}>
                        <CreditCard size={48} color={colors.textSecondary} weight="light" />
                        <Text style={[styles.emptyTitle, { color: colors.text }]}>Borç kaydı yok</Text>
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            Borçlarınızı ekleyerek takip edin
                        </Text>
                        <TouchableOpacity
                            style={[styles.emptyButton, { backgroundColor: colors.tint }]}
                            onPress={openAddModal}
                        >
                            <Plus size={16} color="#FFF" weight="bold" />
                            <Text style={styles.emptyButtonText}>Borç Ekle</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Add/Edit Modal */}
            <Modal visible={showModal} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setShowModal(false)}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <KeyboardAvoidingView
                        style={styles.modalOverlay}
                        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : (StatusBar.currentHeight || 0)}
                    >
                        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                {editingDebt ? 'Borcu Düzenle' : 'Yeni Borç'}
                            </Text>

                            {/* Icon selector */}
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.iconSelector}
                            >
                                {DEBT_ICONS.map((item) => {
                                    const ItemIcon = item.icon;
                                    const isSelected = formIcon === item.key;
                                    return (
                                        <TouchableOpacity
                                            key={item.key}
                                            style={[
                                                styles.iconOption,
                                                {
                                                    backgroundColor: isSelected ? colors.tint : colors.surface,
                                                    borderColor: isSelected ? colors.tint : colors.border,
                                                },
                                            ]}
                                            onPress={() => setFormIcon(item.key)}
                                        >
                                            <ItemIcon size={18} color={isSelected ? '#FFF' : colors.text} weight="light" />
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>

                            <View style={styles.formGroup}>
                                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Borç Adı</Text>
                                <TextInput
                                    style={[styles.formInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                                    value={formName}
                                    onChangeText={setFormName}
                                    placeholder="ör. Kredi Kartı, Konut Kredisi"
                                    placeholderTextColor={colors.textSecondary}
                                />
                            </View>

                            <View style={styles.formRow}>
                                <View style={[styles.formGroup, { flex: 1 }]}>
                                    <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Toplam Tutar</Text>
                                    <TextInput
                                        style={[styles.formInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                                        value={formTotal}
                                        onChangeText={setFormTotal}
                                        placeholder="₺0"
                                        placeholderTextColor={colors.textSecondary}
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={[styles.formGroup, { flex: 1 }]}>
                                    <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Kalan Borç</Text>
                                    <TextInput
                                        style={[styles.formInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                                        value={formRemaining}
                                        onChangeText={setFormRemaining}
                                        placeholder="₺0"
                                        placeholderTextColor={colors.textSecondary}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Aylık Ödeme</Text>
                                <TextInput
                                    style={[styles.formInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                                    value={formMonthly}
                                    onChangeText={setFormMonthly}
                                    placeholder="₺0"
                                    placeholderTextColor={colors.textSecondary}
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalCancel, { borderColor: colors.border }]}
                                    onPress={() => setShowModal(false)}
                                >
                                    <Text style={[styles.modalCancelText, { color: colors.text }]}>İptal</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalSave, { backgroundColor: colors.tint }]}
                                    onPress={handleSave}
                                >
                                    <Text style={styles.modalSaveText}>
                                        {editingDebt ? 'Güncelle' : 'Ekle'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </TouchableWithoutFeedback>
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
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        flex: 1,
        fontSize: 20,
        fontFamily: 'DMSerifDisplay_400Regular',
        marginLeft: 4,
    },
    addBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        paddingHorizontal: 16,
    },
    summaryCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    summaryDivider: {
        width: 1,
        height: 28,
    },
    summaryLabel: {
        fontSize: 10,
        fontFamily: 'Outfit_600SemiBold',
        letterSpacing: 1,
    },
    summaryAmount: {
        fontSize: 18,
        fontFamily: 'Outfit_600SemiBold',
    },
    debtCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 10,
    },
    debtTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    debtIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    debtInfo: {
        flex: 1,
        marginLeft: 12,
    },
    debtName: {
        fontSize: 15,
        fontFamily: 'Outfit_600SemiBold',
    },
    debtMeta: {
        fontSize: 12,
        fontFamily: 'Outfit_400Regular',
        marginTop: 2,
    },
    debtBottom: {
        gap: 6,
    },
    debtAmounts: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    debtRemaining: {
        fontSize: 17,
        fontFamily: 'Outfit_600SemiBold',
    },
    debtTotal: {
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
    },
    progressTrack: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 11,
        fontFamily: 'Outfit_500Medium',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 64,
        gap: 8,
    },
    emptyTitle: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        marginTop: 8,
    },
    emptyText: {
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
    },
    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        gap: 6,
        marginTop: 16,
    },
    emptyButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontFamily: 'Outfit_600SemiBold',
    },
    // Modal
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: 'DMSerifDisplay_400Regular',
        marginBottom: 16,
    },
    iconSelector: {
        gap: 8,
        marginBottom: 20,
    },
    iconOption: {
        width: 42,
        height: 42,
        borderRadius: 21,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    formGroup: {
        marginBottom: 14,
    },
    formRow: {
        flexDirection: 'row',
        gap: 10,
    },
    formLabel: {
        fontSize: 11,
        fontFamily: 'Outfit_500Medium',
        letterSpacing: 0.3,
        marginBottom: 6,
    },
    formInput: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        fontFamily: 'Outfit_500Medium',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 8,
    },
    modalCancel: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1,
        alignItems: 'center',
    },
    modalCancelText: {
        fontSize: 14,
        fontFamily: 'Outfit_500Medium',
    },
    modalSave: {
        flex: 2,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
    },
    modalSaveText: {
        color: '#FFF',
        fontSize: 14,
        fontFamily: 'Outfit_600SemiBold',
    },
});
