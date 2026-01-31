import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, Switch, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { resetDatabase } from '@/database';
import { PinSetupModal } from '@/components/PinSetupModal';
import * as LocalAuthentication from 'expo-local-authentication';

interface SettingItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    danger?: boolean;
    rightElement?: React.ReactNode;
}

function SettingItem({ icon, title, subtitle, onPress, danger, rightElement }: SettingItemProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    return (
        <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={onPress}
            disabled={!onPress && !rightElement}
        >
            <View style={[styles.iconContainer, { backgroundColor: danger ? colors.expense + '20' : colors.tint + '20' }]}>
                <Ionicons name={icon} size={22} color={danger ? colors.expense : colors.tint} />
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
            {rightElement ? rightElement : <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />}
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
        removePin,
        enableBiometric
    } = useTheme();

    const [showPinSetup, setShowPinSetup] = useState(false);
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
            'Tüm veriler silinecek. Bu işlem geri alınamaz. Emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sıfırla',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await resetDatabase();
                            // Force re-render by navigating away and back
                            router.replace('/(tabs)/settings');
                            setTimeout(() => {
                                router.replace('/(tabs)');
                                Alert.alert('Başarılı', 'Veritabanı sıfırlandı.');
                            }, 100);
                        } catch (error) {
                            Alert.alert('Hata', 'Veritabanı sıfırlanamadı.');
                        }
                    },
                },
            ]
        );
    };

    const handleThemeChange = () => {
        // Cycle through themes: light -> dark -> system -> light
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

    const handlePinToggle = () => {
        if (isPinEnabled) {
            // Ask to remove PIN
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
            // Show PIN setup modal
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
        if (biometricType === 'face') {
            return 'Face ID';
        }
        return 'Touch ID';
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView style={styles.scrollView}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>GÖRÜNÜM</Text>

                <SettingItem
                    icon={theme === 'dark' ? 'moon' : 'sunny-outline'}
                    title="Tema"
                    subtitle={getThemeLabel()}
                    onPress={handleThemeChange}
                />

                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>GÜVENLİK</Text>

                <SettingItem
                    icon="lock-closed-outline"
                    title="PIN Kodu"
                    subtitle={isPinEnabled ? 'Aktif' : 'Kapalı'}
                    onPress={handlePinToggle}
                    rightElement={
                        <View style={styles.switchContainer}>
                            <Switch
                                value={isPinEnabled}
                                onValueChange={handlePinToggle}
                                trackColor={{ false: colors.border, true: colors.tint + '50' }}
                                thumbColor={isPinEnabled ? colors.tint : colors.textSecondary}
                            />
                        </View>
                    }
                />

                {biometricAvailable && (
                    <SettingItem
                        icon={biometricType === 'face' ? 'scan-outline' : 'finger-print-outline'}
                        title={getBiometricLabel()}
                        subtitle={isBiometricEnabled ? 'Aktif' : 'Kapalı'}
                        rightElement={
                            <View style={styles.switchContainer}>
                                <Switch
                                    value={isBiometricEnabled}
                                    onValueChange={handleBiometricToggle}
                                    trackColor={{ false: colors.border, true: colors.tint + '50' }}
                                    thumbColor={isBiometricEnabled ? colors.tint : colors.textSecondary}
                                    disabled={!isPinEnabled}
                                />
                            </View>
                        }
                    />
                )}

                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>GENEL</Text>

                <SettingItem
                    icon="wallet-outline"
                    title="Hesaplar"
                    subtitle="Nakit, banka hesapları"
                    onPress={() => router.push('/accounts')}
                />
                <SettingItem
                    icon="pricetags-outline"
                    title="Kategoriler"
                    subtitle="Gelir ve gider kategorileri"
                    onPress={() => router.push('/categories')}
                />
                <SettingItem
                    icon="repeat-outline"
                    title="Tekrarlayan İşlemler"
                    subtitle="Maaş, faturalar, abonelikler"
                    onPress={() => router.push('/recurring')}
                />

                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ENTEGRASYONLAR</Text>

                <SettingItem
                    icon="calendar-outline"
                    title="Google Takvim"
                    subtitle="Ödeme hatırlatıcıları"
                    onPress={() => Alert.alert('Yakında', 'Bu özellik yakında eklenecek.')}
                />
                <SettingItem
                    icon="cloud-outline"
                    title="Bulut Senkronizasyonu"
                    subtitle="Verilerinizi yedekleyin"
                    onPress={() => Alert.alert('Yakında', 'Bu özellik yakında eklenecek.')}
                />

                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>VERİ</Text>

                <SettingItem
                    icon="download-outline"
                    title="Dışa Aktar"
                    subtitle="CSV veya PDF olarak"
                    onPress={() => Alert.alert('Yakında', 'Bu özellik yakında eklenecek.')}
                />
                <SettingItem
                    icon="trash-outline"
                    title="Veritabanını Sıfırla"
                    subtitle="Tüm verileri sil"
                    onPress={handleResetDatabase}
                    danger
                />

                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>GELİŞTİRİCİ</Text>

                <SettingItem
                    icon="flask-outline"
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
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        marginHorizontal: 20,
        marginTop: 24,
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        marginHorizontal: 16,
        marginVertical: 3,
        borderRadius: 14,
        borderWidth: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingContent: {
        flex: 1,
        marginLeft: 12,
    },
    settingTitle: {
        fontSize: 15,
        fontWeight: '500',
    },
    settingSubtitle: {
        fontSize: 12,
        marginTop: 3,
    },
    switchContainer: {
        marginLeft: 8,
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    version: {
        fontSize: 13,
    },
});
