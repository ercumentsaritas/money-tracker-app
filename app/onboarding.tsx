import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Dimensions,
    Keyboard,
    TouchableWithoutFeedback,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
    Sun, Moon, Wallet, Briefcase, Calendar,
    TrendUp, TrendDown, ArrowRight, ArrowLeft,
    House, PlusCircle, ListBullets, Sparkle, Gear, Info,
} from 'phosphor-react-native';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/Colors';
import { updateAccountBalance, getAllAccounts, initDatabase, addRecurringTransaction, getAllCategories } from '@/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

type Step = 'theme' | 'balance' | 'income' | 'incomeDay' | 'extraIncome' | 'expenses' | 'expensesDays' | 'tour';

const TOUR_FEATURES = [
    {
        icon: House,
        title: 'Ana Sayfa',
        description: 'Aylık gelir, gider ve bakiyenizi tek bakışta görün.',
        color: '#5B6F5B',
    },
    {
        icon: PlusCircle,
        title: 'İşlem Ekleme',
        description: 'Sağ alttaki + butonu ile hızlıca gelir veya gider ekleyin.',
        color: '#6B9F6B',
    },
    {
        icon: ListBullets,
        title: 'İşlemler',
        description: 'Tüm işlemlerinizi listeleyin, filtreleyin ve yönetin.',
        color: '#7BA67B',
    },
    {
        icon: Sparkle,
        title: 'AI Asistan',
        description: 'Finansal durumunuz hakkında sorular sorun, öneriler alın.',
        color: '#8BB08B',
    },
    {
        icon: Gear,
        title: 'Ayarlar',
        description: 'Hesapları, kategorileri yönetin ve temayı değiştirin.',
        color: '#9BBB9B',
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
            setOnboarded();
            router.replace('/(tabs)');
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

            if (balance) {
                const initialBalance = parseFloat(balance.replace(/[^0-9.-]/g, '')) || 0;
                console.log('[Onboarding] Setting balance to:', initialBalance);
                await updateAccountBalance(cashAccount.id, initialBalance);
            }

            // Save debt info to AsyncStorage
            const debtAmount = debt ? parseFloat(debt.replace(/[^0-9.-]/g, '')) || 0 : 0;
            await AsyncStorage.setItem('user_total_debt', debtAmount.toString());

            // Save monthly income for debt ratio calculation
            const monthlyIncome = mainIncome ? parseFloat(mainIncome.replace(/[^0-9.-]/g, '')) || 0 : 0;
            await AsyncStorage.setItem('user_monthly_income', monthlyIncome.toString());

            const getNextDate = (dayOfMonth: number) => {
                const now = new Date();
                let nextDate = new Date(now.getFullYear(), now.getMonth(), dayOfMonth);
                if (nextDate <= now) {
                    nextDate.setMonth(nextDate.getMonth() + 1);
                }
                return nextDate.toISOString();
            };

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
        else if (currentStep === 'tour') {
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

    const getStepNumber = () => {
        const steps: Step[] = ['theme', 'balance', 'income', 'incomeDay', 'extraIncome', 'expenses', 'expensesDays', 'tour'];
        return steps.indexOf(currentStep) + 1;
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
                                width: index === currentIndex ? 28 : 8,
                            },
                        ]}
                    />
                ))}
            </View>
        );
    };

    const renderThemeStep = () => (
        <View style={styles.stepContent}>
            <View style={[styles.iconCircle, { backgroundColor: colors.tint + '10' }]}>
                {selectedTheme === 'light' ? (
                    <Sun size={32} color={colors.tint} weight="light" />
                ) : (
                    <Moon size={32} color={colors.tint} weight="light" />
                )}
            </View>
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
                    <Sun size={24} color={Colors.light.text} weight="light" />
                    <Text style={[styles.themeText, { color: Colors.light.text }]}>Açık</Text>
                    {selectedTheme === 'light' && (
                        <View style={[styles.checkmark, { backgroundColor: colors.tint }]}>
                            <Text style={styles.checkmarkText}>✓</Text>
                        </View>
                    )}
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
                    <Moon size={24} color={Colors.dark.text} weight="light" />
                    <Text style={[styles.themeText, { color: Colors.dark.text }]}>Koyu</Text>
                    {selectedTheme === 'dark' && (
                        <View style={[styles.checkmark, { backgroundColor: colors.tint }]}>
                            <Text style={styles.checkmarkText}>✓</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderInputStep = (icon: React.ComponentType<any>, iconColor: string, title: string, description: string, inputs: { label: string; value: string; onChange: (text: string) => void }[]) => {
        const Icon = icon;
        return (
            <View style={styles.stepContent}>
                <View style={[styles.iconCircle, { backgroundColor: iconColor + '10' }]}>
                    <Icon size={32} color={iconColor} weight="light" />
                </View>
                <Text style={[styles.stepTitle, { color: colors.text }]}>{title}</Text>
                <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                    {description}
                </Text>

                {inputs.map((input, index) => (
                    <View key={index} style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{input.label}</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                            value={input.value}
                            onChangeText={input.onChange}
                            placeholder="₺0"
                            placeholderTextColor={colors.textSecondary}
                            keyboardType="numeric"
                        />
                    </View>
                ))}
            </View>
        );
    };

    const renderBalanceStep = () => renderInputStep(
        Wallet, colors.tint, 'Mevcut Durumunuz', 'Finansal durumunuzu girin',
        [
            { label: 'Mevcut Bakiye', value: balance, onChange: setBalance },
            { label: 'Toplam Borç (varsa)', value: debt, onChange: setDebt },
        ]
    );

    const renderIncomeStep = () => renderInputStep(
        Briefcase, colors.income, 'Ana Geliriniz', 'Aylık düzenli maaş veya ana geliriniz',
        [{ label: 'Aylık Maaş / Gelir', value: mainIncome, onChange: setMainIncome }]
    );

    const renderExtraIncomeStep = () => renderInputStep(
        TrendUp, colors.income, 'Ek Gelirler', 'Varsa kira geliri, freelance vb. ek gelirler',
        [{ label: 'Aylık Ek Gelir (Opsiyonel)', value: extraIncome, onChange: setExtraIncome }]
    );

    const renderDayPicker = (title: string, iconComponent: React.ComponentType<any>, iconColor: string, description: string, sections: { label: string; day: number; setDay: (d: number) => void; color: string }[]) => {
        const Icon = iconComponent;
        return (
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.stepContent}>
                    <View style={[styles.iconCircle, { backgroundColor: iconColor + '10' }]}>
                        <Icon size={32} color={iconColor} weight="light" />
                    </View>
                    <Text style={[styles.stepTitle, { color: colors.text }]}>{title}</Text>
                    <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                        {description}
                    </Text>

                    {sections.map((section, index) => (
                        <View key={index} style={styles.daySection}>
                            <Text style={[styles.daySectionTitle, { color: colors.text }]}>{section.label}</Text>
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
                                                backgroundColor: section.day === day ? section.color : colors.surface,
                                                borderColor: section.day === day ? section.color : colors.border,
                                            },
                                        ]}
                                        onPress={() => section.setDay(day)}
                                    >
                                        <Text
                                            style={[
                                                styles.dayButtonText,
                                                { color: section.day === day ? '#FFFFFF' : colors.text },
                                            ]}
                                        >
                                            {day}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    ))}

                    <View style={[styles.infoBox, { backgroundColor: iconColor + '10' }]}>
                        <Info size={18} color={iconColor} weight="regular" />
                        <Text style={[styles.infoText, { color: iconColor }]}>
                            {sections.length === 1
                                ? `Her ayın ${sections[0].day}. günü otomatik olarak işlenecek`
                                : 'Bu giderler tekrarlayan işlem olarak kaydedilecek'}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        );
    };

    const renderIncomeDayStep = () => renderDayPicker(
        'Maaş Günü', Calendar, colors.income,
        'Maaşınız ayın hangi günü yatıyor?',
        [{ label: '💰 Maaş Günü', day: mainIncomeDay, setDay: setMainIncomeDay, color: colors.income }]
    );

    const renderExpensesStep = () => renderInputStep(
        TrendDown, colors.expense, 'Gider Kalemleri', 'Aylık ortalama giderlerinizi girin',
        [
            { label: 'Kira', value: rentExpense, onChange: setRentExpense },
            { label: 'Faturalar (Elektrik, Su, İnternet)', value: billExpense, onChange: setBillExpense },
            { label: 'Mutfak / Market', value: kitchenExpense, onChange: setKitchenExpense },
            { label: 'Diğer (Harçlık, Eğlence vb.)', value: otherExpense, onChange: setOtherExpense },
        ]
    );

    const renderExpensesDaysStep = () => {
        const sections = [];
        if (rentExpense && parseFloat(rentExpense) > 0) {
            sections.push({ label: '🏠 Kira', day: rentDay, setDay: setRentDay, color: colors.expense });
        }
        if (billExpense && parseFloat(billExpense) > 0) {
            sections.push({ label: '💡 Faturalar', day: billsDay, setDay: setBillsDay, color: colors.expense });
        }
        return renderDayPicker(
            'Ödeme Günleri', Calendar, colors.expense,
            'Kira ve faturalarınız ayın hangi günü ödeniyor?',
            sections
        );
    };

    const renderTourStep = () => {
        return (
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.stepContent}>
                    <Text style={[styles.stepTitle, { color: colors.text }]}>Hazırsınız! 🎉</Text>
                    <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                        İşte uygulamanın temel özellikleri
                    </Text>

                    <View style={styles.featureGrid}>
                        {TOUR_FEATURES.map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <View
                                    key={index}
                                    style={[styles.featureCard, { backgroundColor: colors.surface }]}
                                >
                                    <View style={[styles.featureIcon, { backgroundColor: feature.color + '10' }]}>
                                        <Icon size={22} color={feature.color} weight="light" />
                                    </View>
                                    <Text style={[styles.featureTitle, { color: colors.text }]}>
                                        {feature.title}
                                    </Text>
                                    <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
                                        {feature.description}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
            </ScrollView>
        );
    };

    const dismissKeyboard = () => {
        Keyboard.dismiss();
    };

    return (
        <TouchableWithoutFeedback onPress={dismissKeyboard} accessible={false}>
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
                <KeyboardAvoidingView
                    style={styles.keyboardAvoid}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : StatusBar.currentHeight || 0}
                >
                    {renderStepIndicator()}

                    <View style={styles.contentContainer}>
                        {currentStep === 'theme' && renderThemeStep()}
                        {currentStep === 'balance' && renderBalanceStep()}
                        {currentStep === 'income' && renderIncomeStep()}
                        {currentStep === 'incomeDay' && renderIncomeDayStep()}
                        {currentStep === 'extraIncome' && renderExtraIncomeStep()}
                        {currentStep === 'expenses' && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {renderExpensesStep()}
                            </ScrollView>
                        )}
                        {currentStep === 'expensesDays' && renderExpensesDaysStep()}
                        {currentStep === 'tour' && renderTourStep()}
                    </View>

                    {!isKeyboardVisible && (
                        <View style={styles.footer}>
                            {currentStep !== 'theme' && currentStep !== 'tour' && (
                                <TouchableOpacity style={[styles.skipButton]} onPress={handleSkip}>
                                    <Text style={[styles.skipText, { color: colors.textSecondary }]}>Atla</Text>
                                </TouchableOpacity>
                            )}

                            {currentStep !== 'theme' && currentStep !== 'tour' && (
                                <TouchableOpacity
                                    style={[styles.backButton, { borderColor: colors.border }]}
                                    onPress={handleBack}
                                >
                                    <ArrowLeft size={18} color={colors.text} weight="regular" />
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                style={[styles.nextButton, { backgroundColor: colors.tint }]}
                                onPress={handleNext}
                            >
                                <Text style={styles.nextText}>
                                    {currentStep === 'tour' ? 'Başlayalım' : 'Devam'}
                                </Text>
                                <ArrowRight size={18} color="#FFFFFF" weight="regular" />
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
        height: 6,
        borderRadius: 3,
    },
    contentContainer: {
        flex: 1,
    },
    stepContent: {
        alignItems: 'center',
        padding: 28,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepTitle: {
        fontSize: 26,
        fontFamily: 'DMSerifDisplay_400Regular',
        marginTop: 24,
        textAlign: 'center',
    },
    stepDescription: {
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 21,
    },
    themeOptions: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 40,
    },
    themeOption: {
        width: 120,
        height: 120,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    themeText: {
        fontSize: 14,
        fontFamily: 'Outfit_500Medium',
        marginTop: 8,
    },
    checkmark: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkmarkText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    inputGroup: {
        width: '100%',
        marginTop: 20,
    },
    inputLabel: {
        fontSize: 12,
        fontFamily: 'Outfit_500Medium',
        marginBottom: 8,
        letterSpacing: 0.3,
    },
    input: {
        borderWidth: 1,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 20,
        fontFamily: 'Outfit_500Medium',
        textAlign: 'center',
    },
    // Day picker styles
    dayPickerContainer: {
        width: '100%',
        marginTop: 24,
    },
    dayPickerScroll: {
        paddingHorizontal: 4,
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
        fontSize: 14,
        fontFamily: 'Outfit_600SemiBold',
    },
    daySection: {
        width: '100%',
        marginTop: 24,
    },
    daySectionTitle: {
        fontSize: 15,
        fontFamily: 'Outfit_600SemiBold',
        marginBottom: 12,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 14,
        borderRadius: 14,
        marginTop: 24,
        width: '100%',
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
        lineHeight: 18,
    },
    // Tour feature grid
    featureGrid: {
        width: '100%',
        marginTop: 24,
        gap: 10,
    },
    featureCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 14,
    },
    featureIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureTitle: {
        fontSize: 15,
        fontFamily: 'Outfit_600SemiBold',
        flex: 0,
        minWidth: 80,
    },
    featureDesc: {
        flex: 1,
        fontSize: 12,
        fontFamily: 'Outfit_400Regular',
        lineHeight: 17,
    },
    // Footer
    footer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        paddingVertical: 16,
        paddingBottom: 32,
        gap: 10,
    },
    backButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    nextButton: {
        flex: 1,
        height: 48,
        borderRadius: 24,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    nextText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontFamily: 'Outfit_600SemiBold',
    },
    skipButton: {
        height: 48,
        paddingHorizontal: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    skipText: {
        fontSize: 14,
        fontFamily: 'Outfit_500Medium',
    },
});
