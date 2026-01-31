import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTheme } from '@/context/ThemeContext';
import { resetDatabase } from '@/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TestButtonProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    description: string;
    onPress: () => void;
    color?: string;
}

function TestButton({ icon, title, description, onPress, color }: TestButtonProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const iconColor = color || colors.tint;

    return (
        <TouchableOpacity
            style={[styles.testButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={onPress}
        >
            <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
                <Ionicons name={icon} size={24} color={iconColor} />
            </View>
            <View style={styles.buttonContent}>
                <Text style={[styles.buttonTitle, { color: colors.text }]}>{title}</Text>
                <Text style={[styles.buttonDescription, { color: colors.textSecondary }]}>{description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
    );
}

export default function DevScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const { resetOnboarding, setTheme } = useTheme();

    const handleFullReset = () => {
        Alert.alert(
            'Tam Sıfırlama',
            'Uygulama tamamen sıfırlanacak. İlk açılış ekranına döneceksiniz. Emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sıfırla',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await resetDatabase();
                            await resetOnboarding();
                            router.replace('/onboarding');
                        } catch (error) {
                            Alert.alert('Hata', 'Sıfırlama işlemi başarısız oldu.');
                        }
                    },
                },
            ]
        );
    };

    const handleResetOnboardingOnly = () => {
        resetOnboarding();
        router.replace('/onboarding');
    };

    const handleClearStorage = () => {
        Alert.alert(
            'AsyncStorage Temizle',
            'Tüm AsyncStorage verileri silinecek. Emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Temizle',
                    style: 'destructive',
                    onPress: async () => {
                        await AsyncStorage.clear();
                        Alert.alert('Başarılı', 'AsyncStorage temizlendi!');
                    },
                },
            ]
        );
    };

    const handleTestOnboarding = () => {
        router.push('/onboarding');
    };

    const handleTestCalendar = () => {
        router.push('/add-transaction');
    };

    const handleTestAccounts = () => {
        router.push('/accounts');
    };

    const handleTestCategories = () => {
        router.push('/categories');
    };

    const handleTestRecurring = () => {
        router.push('/recurring');
    };

    const handleTestAIChat = () => {
        router.push('/(tabs)/ai-chat');
    };

    const handleForceTheme = (theme: 'light' | 'dark') => {
        setTheme(theme);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>🧪 Test Alanı</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SIFIRLAMA</Text>

                <TestButton
                    icon="refresh-circle"
                    title="Tam Sıfırlama"
                    description="Veritabanı + onboarding sıfırla"
                    onPress={handleFullReset}
                    color={colors.expense}
                />

                <TestButton
                    icon="reload"
                    title="Onboarding'i Sıfırla"
                    description="Kurulum sihirbazına dön"
                    onPress={handleResetOnboardingOnly}
                    color={colors.warning}
                />

                <TestButton
                    icon="trash"
                    title="AsyncStorage Temizle"
                    description="Tüm yerel depolamayı sil"
                    onPress={handleClearStorage}
                    color={colors.expense}
                />

                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>EKRAN TESTLERİ</Text>

                <TestButton
                    icon="rocket"
                    title="Onboarding Ekranı"
                    description="Kurulum sihirbazını test et"
                    onPress={handleTestOnboarding}
                />

                <TestButton
                    icon="calendar"
                    title="Takvim (İşlem Ekle)"
                    description="Takvim picker'ı test et"
                    onPress={handleTestCalendar}
                />

                <TestButton
                    icon="wallet"
                    title="Hesaplar"
                    description="Hesap yönetimini test et"
                    onPress={handleTestAccounts}
                />

                <TestButton
                    icon="pricetags"
                    title="Kategoriler"
                    description="Kategori yönetimini test et"
                    onPress={handleTestCategories}
                />

                <TestButton
                    icon="repeat"
                    title="Tekrarlayan İşlemler"
                    description="Tekrarlayan işlemleri test et"
                    onPress={handleTestRecurring}
                />

                <TestButton
                    icon="sparkles"
                    title="AI Asistan"
                    description="Chat ekranını test et"
                    onPress={handleTestAIChat}
                />

                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>TEMA TESTLERİ</Text>

                <View style={styles.themeButtons}>
                    <TouchableOpacity
                        style={[styles.themeButton, { backgroundColor: Colors.light.surface, borderColor: colors.border }]}
                        onPress={() => handleForceTheme('light')}
                    >
                        <Ionicons name="sunny" size={24} color={Colors.light.text} />
                        <Text style={[styles.themeButtonText, { color: Colors.light.text }]}>Açık</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.themeButton, { backgroundColor: Colors.dark.surface, borderColor: colors.border }]}
                        onPress={() => handleForceTheme('dark')}
                    >
                        <Ionicons name="moon" size={24} color={Colors.dark.text} />
                        <Text style={[styles.themeButtonText, { color: Colors.dark.text }]}>Koyu</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                        Bu ekran geliştirici testleri içindir
                    </Text>
                </View>
            </ScrollView>
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
    content: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
        marginTop: 16,
        marginBottom: 12,
    },
    testButton: {
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
    buttonContent: {
        flex: 1,
        marginLeft: 14,
    },
    buttonTitle: {
        fontSize: 15,
        fontWeight: '500',
    },
    buttonDescription: {
        fontSize: 13,
        marginTop: 2,
    },
    themeButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    themeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
    },
    themeButtonText: {
        fontSize: 15,
        fontWeight: '500',
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    footerText: {
        fontSize: 13,
    },
});
