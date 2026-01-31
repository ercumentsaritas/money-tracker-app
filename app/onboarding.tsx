import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    TextInput,
    ScrollView,
    Dimensions,
    Keyboard,
    TouchableWithoutFeedback,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/Colors';
import { updateAccountBalance, getAllAccounts, initDatabase, addRecurringTransaction, getAllCategories } from '@/database';

const { width } = Dimensions.get('window');

type Step = 'theme' | 'balance' | 'income' | 'incomeDay' | 'extraIncome' | 'expenses' | 'expensesDays' | 'tour';

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

    // Day of month selections for recurring transactions
    const [mainIncomeDay, setMainIncomeDay] = useState(1);
    const [rentDay, setRentDay] = useState(1);
    const [billsDay, setBillsDay] = useState(1);

    const [tourIndex, setTourIndex] = useState(0);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    const colors = Colors[selectedTheme];

    // Track keyboard visibility
    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            () => setIsKeyboardVisible(true)
        );
        const keyboardDidHideListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setIsKeyboardVisible(false)
        );

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    const handleNext = async () => {
        if (currentStep === 'theme') {
            setTheme(selectedTheme);
            setCurrentStep('balance');
        } else if (currentStep === 'balance') {
            setCurrentStep('income');
        } else if (currentStep === 'income') {
            // Only go to incomeDay if main income is entered
            if (mainIncome && parseFloat(mainIncome) > 0) {
                setCurrentStep('incomeDay');
            } else {
                setCurrentStep('extraIncome');
            }
        } else if (currentStep === 'incomeDay') {
            setCurrentStep('extraIncome');
        } else if (currentStep === 'extraIncome') {
            setCurrentStep('expenses');
        } else if (currentStep === 'expenses') {
            // Only go to expensesDays if rent or bills are entered
            if ((rentExpense && parseFloat(rentExpense) > 0) || (billExpense && parseFloat(billExpense) > 0)) {
                setCurrentStep('expensesDays');
            } else {
                await saveData();
                setCurrentStep('tour');
            }
        } else if (currentStep === 'expensesDays') {
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
        console.log('[Onboarding] saveData called');
        console.log('[Onboarding] balance:', balance, 'mainIncome:', mainIncome, 'rentExpense:', rentExpense, 'billExpense:', billExpense);

        try {
            await initDatabase();
            const accounts = await getAllAccounts();
            console.log('[Onboarding] accounts:', accounts);
            const cashAccount = accounts.find(a => a.name.toLowerCase().includes('nakit')) || accounts[0];

            if (!cashAccount) {
                console.log('[Onboarding] No cash account found!');
                return;
            }
            console.log('[Onboarding] Using account:', cashAccount);

            // 1. Update Balance (only the initial balance, not affected by recurring)
            if (balance) {
                const initialBalance = parseFloat(balance.replace(/[^0-9.-]/g, '')) || 0;
                console.log('[Onboarding] Setting balance to:', initialBalance);
                await updateAccountBalance(cashAccount.id, initialBalance);
            }

            // Helper to calculate next occurrence date
            const getNextDate = (dayOfMonth: number) => {
                const now = new Date();
                let nextDate = new Date(now.getFullYear(), now.getMonth(), dayOfMonth);
                if (nextDate <= now) {
                    nextDate.setMonth(nextDate.getMonth() + 1);
                }
                return nextDate.toISOString();
            };

            // 2. Add Recurring Income - Main Income
            if (mainIncome) {
                const amount = parseFloat(mainIncome.replace(/[^0-9.-]/g, '')) || 0;
                if (amount > 0) {
                    console.log('[Onboarding] Adding recurring income:', amount, 'day:', mainIncomeDay);
                    await addRecurringTransaction({
                        name: 'Aylık Maaş',
                        amount,
                        type: 'income',
                        category_id: 'cat-salary',
                        account_id: cashAccount.id,
                        frequency: 'monthly',
                        day_of_month: mainIncomeDay,
                        next_date: getNextDate(mainIncomeDay),
                    });
                }
            }

            // 3. Add Recurring Expenses - Rent
            if (rentExpense) {
                const amount = parseFloat(rentExpense.replace(/[^0-9.-]/g, '')) || 0;
                if (amount > 0) {
                    console.log('[Onboarding] Adding recurring rent:', amount, 'day:', rentDay);
                    await addRecurringTransaction({
                        name: 'Kira',
                        amount,
                        type: 'expense',
                        category_id: 'cat-rent',
                        account_id: cashAccount.id,
                        frequency: 'monthly',
                        day_of_month: rentDay,
                        next_date: getNextDate(rentDay),
                    });
                }
            }

            // 4. Add Recurring Expenses - Bills
            if (billExpense) {
                const amount = parseFloat(billExpense.replace(/[^0-9.-]/g, '')) || 0;
                if (amount > 0) {
                    console.log('[Onboarding] Adding recurring bills:', amount, 'day:', billsDay);
                    await addRecurringTransaction({
                        name: 'Faturalar',
                        amount,
                        type: 'expense',
                        category_id: 'cat-bills',
                        account_id: cashAccount.id,
                        frequency: 'monthly',
                        day_of_month: billsDay,
                        next_date: getNextDate(billsDay),
                    });
                }
            }

            console.log('[Onboarding] saveData completed successfully');
        } catch (error) {
            console.error('[Onboarding] saveData error:', error);
        }
        // Note: extraIncome, kitchenExpense, otherExpense are not recurring - they're variable
    };

    const handleBack = () => {
        if (currentStep === 'balance') setCurrentStep('theme');
        else if (currentStep === 'income') setCurrentStep('balance');
        else if (currentStep === 'incomeDay') setCurrentStep('income');
        else if (currentStep === 'extraIncome') {
            if (mainIncome && parseFloat(mainIncome) > 0) {
                setCurrentStep('incomeDay');
            } else {
                setCurrentStep('income');
            }
        }
        else if (currentStep === 'expenses') setCurrentStep('extraIncome');
        else if (currentStep === 'expensesDays') setCurrentStep('expenses');
        else if (currentStep === 'tour' && tourIndex > 0) setTourIndex(tourIndex - 1);
        else if (currentStep === 'tour' && tourIndex === 0) {
            if ((rentExpense && parseFloat(rentExpense) > 0) || (billExpense && parseFloat(billExpense) > 0)) {
                setCurrentStep('expensesDays');
            } else {
                setCurrentStep('expenses');
            }
        }
    };

    const handleSkip = () => {
        setOnboarded();
        router.replace('/(tabs)');
    };

    const renderStepIndicator = () => {
        const steps = ['theme', 'balance', 'income', 'incomeDay', 'extraIncome', 'expenses', 'expensesDays', 'tour'];
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

    const renderIncomeDayStep = () => (
        <View style={styles.stepContent}>
            <Ionicons name="calendar-outline" size={60} color={colors.income} />
            <Text style={[styles.stepTitle, { color: colors.text }]}>Maaş Günü</Text>
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                Maaşınız ayın hangi günü yatıyor?
            </Text>

            <View style={styles.dayPickerContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.dayPickerScroll}
                >
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                        <TouchableOpacity
                            key={day}
                            style={[
                                styles.dayButton,
                                {
                                    backgroundColor: mainIncomeDay === day ? colors.income : colors.surface,
                                    borderColor: mainIncomeDay === day ? colors.income : colors.border,
                                },
                            ]}
                            onPress={() => setMainIncomeDay(day)}
                        >
                            <Text
                                style={[
                                    styles.dayButtonText,
                                    { color: mainIncomeDay === day ? '#FFFFFF' : colors.text },
                                ]}
                            >
                                {day}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <View style={[styles.infoBox, { backgroundColor: colors.income + '15' }]}>
                <Ionicons name="information-circle" size={20} color={colors.income} />
                <Text style={[styles.infoText, { color: colors.income }]}>
                    Her ayın {mainIncomeDay}. günü maaşınız otomatik olarak işlenecek
                </Text>
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

    const renderExpensesDaysStep = () => (
        <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.stepContent}>
                <Ionicons name="calendar-outline" size={60} color={colors.expense} />
                <Text style={[styles.stepTitle, { color: colors.text }]}>Ödeme Günleri</Text>
                <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                    Kira ve faturalarınız ayın hangi günü ödeniyor?
                </Text>

                {rentExpense && parseFloat(rentExpense) > 0 && (
                    <View style={styles.daySection}>
                        <Text style={[styles.daySectionTitle, { color: colors.text }]}>🏠 Kira</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.dayPickerScroll}
                        >
                            {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                                <TouchableOpacity
                                    key={day}
                                    style={[
                                        styles.dayButton,
                                        {
                                            backgroundColor: rentDay === day ? colors.expense : colors.surface,
                                            borderColor: rentDay === day ? colors.expense : colors.border,
                                        },
                                    ]}
                                    onPress={() => setRentDay(day)}
                                >
                                    <Text
                                        style={[
                                            styles.dayButtonText,
                                            { color: rentDay === day ? '#FFFFFF' : colors.text },
                                        ]}
                                    >
                                        {day}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {billExpense && parseFloat(billExpense) > 0 && (
                    <View style={styles.daySection}>
                        <Text style={[styles.daySectionTitle, { color: colors.text }]}>💡 Faturalar</Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.dayPickerScroll}
                        >
                            {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                                <TouchableOpacity
                                    key={day}
                                    style={[
                                        styles.dayButton,
                                        {
                                            backgroundColor: billsDay === day ? colors.expense : colors.surface,
                                            borderColor: billsDay === day ? colors.expense : colors.border,
                                        },
                                    ]}
                                    onPress={() => setBillsDay(day)}
                                >
                                    <Text
                                        style={[
                                            styles.dayButtonText,
                                            { color: billsDay === day ? '#FFFFFF' : colors.text },
                                        ]}
                                    >
                                        {day}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                <View style={[styles.infoBox, { backgroundColor: colors.expense + '15' }]}>
                    <Ionicons name="information-circle" size={20} color={colors.expense} />
                    <Text style={[styles.infoText, { color: colors.expense }]}>
                        Bu giderler tekrarlayan işlem olarak kaydedilecek
                    </Text>
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

    const dismissKeyboard = () => {
        Keyboard.dismiss();
    };

    return (
        <TouchableWithoutFeedback onPress={dismissKeyboard} accessible={false}>
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <KeyboardAvoidingView
                    style={styles.keyboardAvoid}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    {renderStepIndicator()}

                    <View style={styles.contentContainer}>
                        {currentStep === 'theme' && renderThemeStep()}
                        {currentStep === 'balance' && renderBalanceStep()}
                        {currentStep === 'income' && renderIncomeStep()}
                        {currentStep === 'incomeDay' && renderIncomeDayStep()}
                        {currentStep === 'extraIncome' && renderExtraIncomeStep()}
                        {currentStep === 'expenses' && renderExpensesStep()}
                        {currentStep === 'expensesDays' && renderExpensesDaysStep()}
                        {currentStep === 'tour' && renderTourStep()}
                    </View>

                    {!isKeyboardVisible && (
                        <View style={styles.footer}>
                            {currentStep !== 'theme' && (
                                <TouchableOpacity style={[styles.skipButton, { borderColor: colors.border }]} onPress={handleSkip}>
                                    <Text style={[styles.skipText, { color: colors.textSecondary }]}>Atla</Text>
                                </TouchableOpacity>
                            )}

                            {currentStep !== 'theme' && (
                                <TouchableOpacity style={[styles.backButton, { borderColor: colors.border }]} onPress={handleBack}>
                                    <Ionicons name="arrow-back" size={20} color={colors.text} />
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={[styles.nextButton, { backgroundColor: colors.tint }]}
                                onPress={handleNext}
                            >
                                <Text style={styles.nextText}>
                                    {currentStep === 'tour' && tourIndex === TOUR_STEPS.length - 1 ? 'Başla' : 'Devam'}
                                </Text>
                                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    )}
                </KeyboardAvoidingView>
            </SafeAreaView>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardAvoid: {
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
        paddingBottom: 32,
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
        height: 50,
        paddingHorizontal: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    skipText: {
        fontSize: 14,
        fontWeight: '500',
    },
    // Day picker styles
    dayPickerContainer: {
        width: '100%',
        marginTop: 24,
    },
    dayPickerScroll: {
        paddingHorizontal: 8,
        gap: 8,
    },
    dayButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
    daySection: {
        width: '100%',
        marginTop: 24,
    },
    daySectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 14,
        borderRadius: 12,
        marginTop: 24,
        width: '100%',
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
    },
});
