import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    TextInput,
    ScrollView,
    Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/Colors';
import { updateAccountBalance, getAllAccounts, initDatabase, addTransaction, getAllCategories } from '@/database';

const { width } = Dimensions.get('window');

type Step = 'theme' | 'balance' | 'income' | 'extraIncome' | 'expenses' | 'tour';

const TOUR_STEPS = [
    {
        icon: 'home-outline' as const,
        title: 'Ana Sayfa',
        description: 'Aylık gelir, gider ve bakiyenizi görün. Son işlemlerinizi takip edin.',
    },
    {
        icon: 'add-circle-outline' as const,
        title: 'İşlem Ekleme',
        description: 'Sağ alttaki + butonu ile yeni gelir veya gider ekleyin.',
    },
    {
        icon: 'list-outline' as const,
        title: 'İşlemler',
        description: 'Tüm işlemlerinizi listeleyin, filtreleyin ve silin.',
    },
    {
        icon: 'sparkles-outline' as const,
        title: 'AI Asistan',
        description: 'Finansal durumunuz hakkında sorular sorun, öneriler alın.',
    },
    {
        icon: 'settings-outline' as const,
        title: 'Ayarlar',
        description: 'Hesapları, kategorileri yönetin ve temayı değiştirin.',
    },
];

export default function OnboardingScreen() {
    const { setTheme, setOnboarded } = useTheme();
    const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark'>('light');
    const [currentStep, setCurrentStep] = useState<Step>('theme');

    // Financial State
    const [balance, setBalance] = useState('');
    const [debt, setDebt] = useState('');

    const [mainIncome, setMainIncome] = useState('');
    const [extraIncome, setExtraIncome] = useState('');

    const [rentExpense, setRentExpense] = useState('');
    const [billExpense, setBillExpense] = useState('');
    const [kitchenExpense, setKitchenExpense] = useState('');
    const [otherExpense, setOtherExpense] = useState('');

    const [tourIndex, setTourIndex] = useState(0);

    const colors = Colors[selectedTheme];

    const handleNext = async () => {
        if (currentStep === 'theme') {
            setTheme(selectedTheme);
            setCurrentStep('balance');
        } else if (currentStep === 'balance') {
            setCurrentStep('income');
        } else if (currentStep === 'income') {
            setCurrentStep('extraIncome');
        } else if (currentStep === 'extraIncome') {
            setCurrentStep('expenses');
        } else if (currentStep === 'expenses') {
            await saveData();
            setCurrentStep('tour');
        } else if (currentStep === 'tour') {
            if (tourIndex < TOUR_STEPS.length - 1) {
                setTourIndex(tourIndex + 1);
            } else {
                setOnboarded();
                router.replace('/(tabs)');
            }
        }
    };

    const saveData = async () => {
        await initDatabase();
        const accounts = await getAllAccounts();
        const cashAccount = accounts.find(a => a.name.toLowerCase().includes('nakit')) || accounts[0];
        const categories = await getAllCategories();

        if (!cashAccount) return;

        // 1. Update Balance
        if (balance) {
            const initialBalance = parseFloat(balance.replace(/[^0-9.-]/g, '')) || 0;
            await updateAccountBalance(cashAccount.id, initialBalance);
        }

        // 2. Add Income Transactions
        const today = new Date().toISOString();

        if (mainIncome) {
            const amount = parseFloat(mainIncome.replace(/[^0-9.-]/g, '')) || 0;
            if (amount > 0) {
                await addTransaction({
                    amount,
                    type: 'income',
                    categoryId: 'cat-salary', // Default ID for Salary
                    accountId: cashAccount.id,
                    date: today,
                    note: 'Aylık Ana Gelir (Başlangıç)'
                });
            }
        }

        if (extraIncome) {
            const amount = parseFloat(extraIncome.replace(/[^0-9.-]/g, '')) || 0;
            if (amount > 0) {
                await addTransaction({
                    amount,
                    type: 'income',
                    categoryId: 'cat-other-in', // Default ID for Other Income
                    accountId: cashAccount.id,
                    date: today,
                    note: 'Ek Gelir (Başlangıç)'
                });
            }
        }

        // 3. Add Expense Transactions
        const addExpense = async (val: string, catId: string, note: string) => {
            const amount = parseFloat(val.replace(/[^0-9.-]/g, '')) || 0;
            if (amount > 0) {
                await addTransaction({
                    amount,
                    type: 'expense',
                    categoryId: catId,
                    accountId: cashAccount.id,
                    date: today,
                    note
                });
            }
        };

        await addExpense(rentExpense, 'cat-rent', 'Kira Gideri (Başlangıç)');
        await addExpense(billExpense, 'cat-bills', 'Fatura Giderleri (Başlangıç)');
        await addExpense(kitchenExpense, 'cat-food', 'Mutfak Giderleri (Başlangıç)');
        await addExpense(otherExpense, 'cat-other-out', 'Diğer Giderler (Başlangıç)');
    };

    const handleBack = () => {
        if (currentStep === 'balance') setCurrentStep('theme');
        else if (currentStep === 'income') setCurrentStep('balance');
        else if (currentStep === 'extraIncome') setCurrentStep('income');
        else if (currentStep === 'expenses') setCurrentStep('extraIncome');
        else if (currentStep === 'tour' && tourIndex > 0) setTourIndex(tourIndex - 1);
        else if (currentStep === 'tour' && tourIndex === 0) setCurrentStep('expenses');
    };

    const handleSkip = () => {
        setOnboarded();
        router.replace('/(tabs)');
    };

    const renderStepIndicator = () => {
        const steps = ['theme', 'balance', 'income', 'extraIncome', 'expenses', 'tour'];
        const currentIndex = steps.indexOf(currentStep);
        return (
            <View style={styles.stepIndicator}>
                {steps.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.stepDot,
                            {
                                backgroundColor: index <= currentIndex ? colors.tint : colors.border,
                                width: index === currentIndex ? 24 : 8,
                            },
                        ]}
                    />
                ))}
            </View>
        );
    };

    const renderThemeStep = () => (
        <View style={styles.stepContent}>
            <Ionicons name="color-palette-outline" size={60} color={colors.tint} />
            <Text style={[styles.stepTitle, { color: colors.text }]}>Tema Seç</Text>
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                Gözleriniz için en uygun temayı seçin
            </Text>

            <View style={styles.themeOptions}>
                <TouchableOpacity
                    style={[
                        styles.themeOption,
                        {
                            backgroundColor: Colors.light.surface,
                            borderColor: selectedTheme === 'light' ? colors.tint : Colors.light.border,
                            borderWidth: selectedTheme === 'light' ? 2 : 1,
                        },
                    ]}
                    onPress={() => setSelectedTheme('light')}
                >
                    <Ionicons name="sunny-outline" size={28} color={Colors.light.text} />
                    <Text style={[styles.themeText, { color: Colors.light.text }]}>Açık</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.themeOption,
                        {
                            backgroundColor: Colors.dark.surface,
                            borderColor: selectedTheme === 'dark' ? colors.tint : Colors.dark.border,
                            borderWidth: selectedTheme === 'dark' ? 2 : 1,
                        },
                    ]}
                    onPress={() => setSelectedTheme('dark')}
                >
                    <Ionicons name="moon-outline" size={28} color={Colors.dark.text} />
                    <Text style={[styles.themeText, { color: Colors.dark.text }]}>Koyu</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderBalanceStep = () => (
        <View style={styles.stepContent}>
            <Ionicons name="wallet-outline" size={60} color={colors.tint} />
            <Text style={[styles.stepTitle, { color: colors.text }]}>Mevcut Durumunuz</Text>
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                Finansal durumunuzu girin
            </Text>

            <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Mevcut Bakiye</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    value={balance}
                    onChangeText={setBalance}
                    placeholder="₺0"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Toplam Borç (varsa)</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    value={debt}
                    onChangeText={setDebt}
                    placeholder="₺0"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                />
            </View>
        </View>
    );

    const renderIncomeStep = () => (
        <View style={styles.stepContent}>
            <Ionicons name="briefcase-outline" size={60} color={colors.income} />
            <Text style={[styles.stepTitle, { color: colors.text }]}>Ana Geliriniz</Text>
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                Aylık düzenli maaş veya ana geliriniz
            </Text>

            <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Aylık Maaş / Gelir</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    value={mainIncome}
                    onChangeText={setMainIncome}
                    placeholder="₺0"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                />
            </View>
        </View>
    );

    const renderExtraIncomeStep = () => (
        <View style={styles.stepContent}>
            <Ionicons name="trending-up-outline" size={60} color={colors.income} />
            <Text style={[styles.stepTitle, { color: colors.text }]}>Ek Gelirler</Text>
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                Varsa kira geliri, freelance vb. ek gelirler
            </Text>

            <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Aylık Ek Gelir (Opsiyonel)</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                    value={extraIncome}
                    onChangeText={setExtraIncome}
                    placeholder="₺0"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                />
            </View>
        </View>
    );

    const renderExpensesStep = () => (
        <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.stepContent}>
                <Ionicons name="trending-down-outline" size={60} color={colors.expense} />
                <Text style={[styles.stepTitle, { color: colors.text }]}>Gider Kalemleri</Text>
                <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                    Aylık ortalama giderlerinizi girin
                </Text>

                <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Kira</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                        value={rentExpense}
                        onChangeText={setRentExpense}
                        placeholder="₺0"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="numeric"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Faturalar (Elektrik, Su, İnternet)</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                        value={billExpense}
                        onChangeText={setBillExpense}
                        placeholder="₺0"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="numeric"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Mutfak / Market</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                        value={kitchenExpense}
                        onChangeText={setKitchenExpense}
                        placeholder="₺0"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="numeric"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Diğer (Harçlık, Eğlence vb.)</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                        value={otherExpense}
                        onChangeText={setOtherExpense}
                        placeholder="₺0"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="numeric"
                    />
                </View>
            </View>
        </ScrollView>
    );

    const renderTourStep = () => {
        const step = TOUR_STEPS[tourIndex];
        return (
            <View style={styles.stepContent}>
                <View style={[styles.tourIconContainer, { backgroundColor: colors.tint + '15' }]}>
                    <Ionicons name={step.icon} size={48} color={colors.tint} />
                </View>
                <Text style={[styles.stepTitle, { color: colors.text }]}>{step.title}</Text>
                <Text style={[styles.tourDescription, { color: colors.textSecondary }]}>
                    {step.description}
                </Text>

                <View style={styles.tourIndicator}>
                    {TOUR_STEPS.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.tourDot,
                                { backgroundColor: index === tourIndex ? colors.tint : colors.border },
                            ]}
                        />
                    ))}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {renderStepIndicator()}

            <View style={styles.contentContainer}>
                {currentStep === 'theme' && renderThemeStep()}
                {currentStep === 'balance' && renderBalanceStep()}
                {currentStep === 'income' && renderIncomeStep()}
                {currentStep === 'extraIncome' && renderExtraIncomeStep()}
                {currentStep === 'expenses' && renderExpensesStep()}
                {currentStep === 'tour' && renderTourStep()}
            </View>

            <View style={styles.footer}>
                {currentStep !== 'theme' && (
                    <TouchableOpacity style={[styles.backButton, { borderColor: colors.border }]} onPress={handleBack}>
                        <Ionicons name="arrow-back" size={20} color={colors.text} />
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[styles.nextButton, { backgroundColor: colors.tint, flex: currentStep === 'theme' ? 1 : undefined }]}
                    onPress={handleNext}
                >
                    <Text style={styles.nextText}>
                        {currentStep === 'tour' && tourIndex === TOUR_STEPS.length - 1 ? 'Başla' : 'Devam'}
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            {currentStep !== 'theme' && (
                <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                    <Text style={[styles.skipText, { color: colors.textSecondary }]}>Atla</Text>
                </TouchableOpacity>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    stepIndicator: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
        paddingTop: 16,
    },
    stepDot: {
        height: 8,
        borderRadius: 4,
    },
    contentContainer: {
        flex: 1,
    },
    stepContent: {
        alignItems: 'center',
        padding: 32,
    },
    stepTitle: {
        fontSize: 24,
        fontWeight: '600',
        marginTop: 24,
        textAlign: 'center',
    },
    stepDescription: {
        fontSize: 15,
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 22,
    },
    themeOptions: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 40,
    },
    themeOption: {
        width: 100,
        height: 100,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    themeText: {
        fontSize: 14,
        fontWeight: '500',
        marginTop: 8,
    },
    inputGroup: {
        width: '100%',
        marginTop: 24,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 18,
        textAlign: 'center',
    },
    tourIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tourDescription: {
        fontSize: 16,
        marginTop: 16,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    tourIndicator: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 40,
    },
    tourDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    footer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        paddingVertical: 16,
        gap: 12,
    },
    backButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    nextButton: {
        flex: 1,
        height: 50,
        borderRadius: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    nextText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    skipButton: {
        alignItems: 'center',
        paddingBottom: 24,
    },
    skipText: {
        fontSize: 14,
    },
});
