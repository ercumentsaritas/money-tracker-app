import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, Switch, Platform, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTheme } from '@/context/ThemeContext';
import {
    Sun, Moon, LockSimple, Fingerprint, Scan,
    Wallet, Tag, ArrowsClockwise, CalendarDots,
    CloudArrowUp, DownloadSimple, Trash, Flask,
    CaretRight, DeviceMobile
} from 'phosphor-react-native';
import { resetDatabase } from '@/database';
import { PinSetupModal } from '@/components/PinSetupModal';
import * as LocalAuthentication from 'expo-local-authentication';

interface SettingItemProps {
    icon: React.ComponentType<any>;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    danger?: boolean;
    rightElement?: React.ReactNode;
}

function SettingItem({ icon: Icon, title, subtitle, onPress, danger, rightElement }: SettingItemProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    return (
        <TouchableOpacity
            style={styles.settingItem}
            onPress={onPress}
            disabled={!onPress && !rightElement}
            activeOpacity={0.6}
        >
            <View style={[styles.iconContainer, {
                backgroundColor: danger ? colors.expense + '12' : colors.tint + '10'
            }]}>
                <Icon size={20} color={danger ? colors.expense : colors.tint} weight="light" />
            </View>
            <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: danger ? colors.expense : colors.text }]}>
                    {title}
                </Text>
                {subtitle && (
                    <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                        {subtitle}
                    </Text>
                )}
            </View>
            {rightElement ? rightElement : (
                <CaretRight size={16} color={colors.textSecondary} weight="light" />
            )}
        </TouchableOpacity>
    );
}

export default function SettingsScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const {
        theme,
        setTheme,
        isPinEnabled,
        isBiometricEnabled,
        setPin,
        enableBiometric,
        resetOnboarding,
        removePin
    } = useTheme();

    const [showPinSetup, setShowPinSetup] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [biometricType, setBiometricType] = useState<'face' | 'fingerprint' | null>(null);

    useEffect(() => {
        checkBiometricSupport();
    }, []);

    const checkBiometricSupport = async () => {
        try {
            const compatible = await LocalAuthentication.hasHardwareAsync();
            const enrolled = await LocalAuthentication.isEnrolledAsync();
            setBiometricAvailable(compatible && enrolled);

            if (compatible) {
                const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
                if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
                    setBiometricType('face');
                } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
                    setBiometricType('fingerprint');
                }
            }
        } catch (e) {
            console.error('Failed to check biometric support:', e);
        }
    };

    const handleResetDatabase = () => {
        Alert.alert(
            'Veritabanını Sıfırla',
            'Tüm veriler, ayarlar ve güvenlik seçenekleri silinecek. Bu işlem geri alınamaz. Emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sıfırla',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setIsResetting(true);
                            await resetDatabase();
                            await resetOnboarding();
                            await removePin();
                            setTimeout(() => {
                                setIsResetting(false);
                                router.replace('/onboarding');
                            }, 1500);
                        } catch (error) {
                            setIsResetting(false);
                            Alert.alert('Hata', 'Veritabanı sıfırlanamadı.');
                        }
                    },
                },
            ]
        );
    };

    const handleThemeChange = () => {
        const themeOrder = ['light', 'dark', 'system'] as const;
        const currentIndex = themeOrder.indexOf(theme);
        const nextIndex = (currentIndex + 1) % themeOrder.length;
        setTheme(themeOrder[nextIndex]);
    };

    const getThemeLabel = () => {
        switch (theme) {
            case 'light': return 'Açık';
            case 'dark': return 'Koyu';
            case 'system': return 'Sistem';
            default: return 'Açık';
        }
    };

    const getThemeIcon = () => {
        return theme === 'dark' ? Moon : Sun;
    };

    const handlePinToggle = () => {
        if (isPinEnabled) {
            Alert.alert(
                'PIN Kodunu Kaldır',
                'PIN kodunu kaldırmak istediğinizden emin misiniz?',
                [
                    { text: 'İptal', style: 'cancel' },
                    {
                        text: 'Kaldır',
                        style: 'destructive',
                        onPress: async () => {
                            await removePin();
                        },
                    },
                ]
            );
        } else {
            setShowPinSetup(true);
        }
    };

    const handlePinSet = async (pin: string) => {
        try {
            await setPin(pin);
            setShowPinSetup(false);
            Alert.alert('Başarılı', 'PIN kodunuz oluşturuldu.');
        } catch (e) {
            Alert.alert('Hata', 'PIN kodu oluşturulamadı.');
        }
    };

    const handleBiometricToggle = async (value: boolean) => {
        try {
            if (value && !isPinEnabled) {
                Alert.alert(
                    'PIN Gerekli',
                    'Biyometrik kimlik doğrulama için önce PIN kodu belirlemeniz gerekiyor.',
                    [{ text: 'Tamam' }]
                );
                return;
            }
            await enableBiometric(value);
        } catch (e) {
            Alert.alert('Hata', 'Biyometrik kimlik doğrulama ayarlanamadı.');
        }
    };

    const getBiometricLabel = () => {
        return biometricType === 'face' ? 'Face ID' : 'Touch ID';
    };

    const getBiometricIcon = () => {
        return biometricType === 'face' ? Scan : Fingerprint;
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Page Title */}
                <Text style={[styles.pageTitle, { color: colors.text }]}>Ayarlar</Text>

                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>GÖRÜNÜM</Text>

                <SettingItem
                    icon={getThemeIcon()}
                    title="Tema"
                    subtitle={getThemeLabel()}
                    onPress={handleThemeChange}
                />

                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>GÜVENLİK</Text>

                <SettingItem
                    icon={LockSimple}
                    title="PIN Kodu"
                    subtitle={isPinEnabled ? 'Aktif' : 'Kapalı'}
                    onPress={handlePinToggle}
                    rightElement={
                        <Switch
                            value={isPinEnabled}
                            onValueChange={handlePinToggle}
                            trackColor={{ false: colors.border, true: colors.tint + '50' }}
                            thumbColor={isPinEnabled ? colors.tint : colors.textSecondary}
                        />
                    }
                />

                {biometricAvailable && (
                    <SettingItem
                        icon={getBiometricIcon()}
                        title={getBiometricLabel()}
                        subtitle={isBiometricEnabled ? 'Aktif' : 'Kapalı'}
                        rightElement={
                            <Switch
                                value={isBiometricEnabled}
                                onValueChange={handleBiometricToggle}
                                trackColor={{ false: colors.border, true: colors.tint + '50' }}
                                thumbColor={isBiometricEnabled ? colors.tint : colors.textSecondary}
                                disabled={!isPinEnabled}
                            />
                        }
                    />
                )}

                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>GENEL</Text>

                <SettingItem
                    icon={Wallet}
                    title="Hesaplar"
                    subtitle="Nakit, banka hesapları"
                    onPress={() => router.push('/accounts')}
                />
                <SettingItem
                    icon={Tag}
                    title="Kategoriler"
                    subtitle="Gelir ve gider kategorileri"
                    onPress={() => router.push('/categories')}
                />
                <SettingItem
                    icon={ArrowsClockwise}
                    title="Tekrarlayan İşlemler"
                    subtitle="Maaş, faturalar, abonelikler"
                    onPress={() => router.push('/recurring')}
                />

                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ENTEGRASYONLAR</Text>

                <SettingItem
                    icon={CalendarDots}
                    title="Google Takvim"
                    subtitle="Ödeme hatırlatıcıları"
                    onPress={() => Alert.alert('Yakında', 'Bu özellik yakında eklenecek.')}
                />
                <SettingItem
                    icon={CloudArrowUp}
                    title="Bulut Senkronizasyonu"
                    subtitle="Verilerinizi yedekleyin"
                    onPress={() => Alert.alert('Yakında', 'Bu özellik yakında eklenecek.')}
                />

                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>VERİ</Text>

                <SettingItem
                    icon={DownloadSimple}
                    title="Dışa Aktar"
                    subtitle="CSV veya PDF olarak"
                    onPress={() => Alert.alert('Yakında', 'Bu özellik yakında eklenecek.')}
                />
                <SettingItem
                    icon={Trash}
                    title="Veritabanını Sıfırla"
                    subtitle="Tüm verileri sil"
                    onPress={handleResetDatabase}
                    danger
                />

                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>GELİŞTİRİCİ</Text>

                <SettingItem
                    icon={Flask}
                    title="Test Alanı"
                    subtitle="Tüm fonksiyonları test et"
                    onPress={() => router.push('/dev')}
                />

                <View style={styles.footer}>
                    <Text style={[styles.version, { color: colors.textSecondary }]}>
                        Gelir Gider Takip v1.0.0
                    </Text>
                </View>
            </ScrollView>

            <PinSetupModal
                visible={showPinSetup}
                onClose={() => setShowPinSetup(false)}
                onPinSet={handlePinSet}
            />

            {/* Resetting Loading Overlay */}
            <Modal transparent visible={isResetting} animationType="fade" statusBarTranslucent>
                <View style={styles.loadingOverlay}>
                    <View style={[styles.loadingContent, { backgroundColor: colors.surface }]}>
                        <ActivityIndicator size="large" color={colors.tint} />
                        <Text style={[styles.loadingText, { color: colors.text }]}>Uygulama Sıfırlanıyor...</Text>
                        <Text style={[styles.loadingSubtext, { color: colors.textSecondary }]}>Lütfen bekleyin, veriler temizleniyor.</Text>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    pageTitle: {
        fontSize: 28,
        fontFamily: 'DMSerifDisplay_400Regular',
        marginHorizontal: 20,
        marginTop: 16,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 11,
        fontFamily: 'Outfit_600SemiBold',
        marginHorizontal: 20,
        marginTop: 24,
        marginBottom: 8,
        letterSpacing: 1.5,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    iconContainer: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingContent: {
        flex: 1,
        marginLeft: 14,
    },
    settingTitle: {
        fontSize: 15,
        fontFamily: 'Outfit_500Medium',
    },
    settingSubtitle: {
        fontSize: 12,
        fontFamily: 'Outfit_400Regular',
        marginTop: 2,
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    version: {
        fontSize: 12,
        fontFamily: 'Outfit_400Regular',
    },
    loadingOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContent: {
        padding: 28,
        borderRadius: 20,
        alignItems: 'center',
        width: '80%',
        maxWidth: 300,
    },
    loadingText: {
        marginTop: 20,
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
    },
    loadingSubtext: {
        marginTop: 8,
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
        textAlign: 'center',
    },
});
