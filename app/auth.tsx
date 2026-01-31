import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Vibration,
    Platform,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTheme } from '@/context/ThemeContext';
import * as LocalAuthentication from 'expo-local-authentication';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resetDatabase } from '@/database/webStorage';

export default function AuthScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const { verifyPin, authenticateWithBiometric, isBiometricEnabled, removePin } = useTheme();

    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [biometricType, setBiometricType] = useState<'face' | 'fingerprint' | null>(null);
    const [resetting, setResetting] = useState(false);

    useEffect(() => {
        checkBiometricType();
    }, []);

    // Auto-trigger biometric auth when screen loads
    useEffect(() => {
        if (isBiometricEnabled) {
            // Small delay to ensure UI is ready
            const timer = setTimeout(() => {
                handleBiometricAuth();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isBiometricEnabled]);

    const checkBiometricType = async () => {
        try {
            const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
            if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
                setBiometricType('face');
            } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
                setBiometricType('fingerprint');
            }
        } catch (e) {
            console.error('Failed to check biometric type:', e);
        }
    };

    const handleNumberPress = async (num: string) => {
        setError('');

        if (pin.length < 6) {
            const newPin = pin + num;
            setPin(newPin);

            if (newPin.length === 6) {
                const isValid = await verifyPin(newPin);
                if (!isValid) {
                    setError('Yanlış PIN kodu');
                    if (Platform.OS !== 'web') {
                        Vibration.vibrate(100);
                    }
                    setPin('');
                }
            }
        }
    };

    const handleDelete = () => {
        setPin(pin.slice(0, -1));
        setError('');
    };

    const handleBiometricAuth = async () => {
        const success = await authenticateWithBiometric();
        if (!success) {
            // User cancelled or failed - they can still use PIN
        }
    };

    const getBiometricIcon = () => {
        if (biometricType === 'face') {
            return 'scan-outline';
        }
        return 'finger-print-outline';
    };

    const getBiometricLabel = () => {
        if (biometricType === 'face') {
            return 'Face ID ile Giriş';
        }
        return 'Touch ID ile Giriş';
    };

    const handleForgotPin = () => {
        Alert.alert(
            'Şifremi Unuttum',
            'Bu işlem tüm verilerinizi silecektir. Devam etmek istediğinize emin misiniz?',
            [
                {
                    text: 'İptal',
                    style: 'cancel',
                },
                {
                    text: 'Devam Et',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setResetting(true);

                            // Reset all data
                            await resetDatabase();

                            // Remove PIN and biometric settings using ThemeContext
                            await removePin();

                            // Small delay to show loading
                            await new Promise(resolve => setTimeout(resolve, 1000));

                            // Redirect to onboarding
                            router.replace('/onboarding');
                        } catch (error) {
                            console.error('Failed to reset:', error);
                            Alert.alert('Hata', 'Sıfırlama işlemi başarısız oldu');
                            setResetting(false);
                        }
                    },
                },
            ]
        );
    };

    const renderDots = () => {
        return (
            <View style={styles.dotsContainer}>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            {
                                backgroundColor: index < pin.length
                                    ? colors.tint
                                    : colors.border,
                            },
                        ]}
                    />
                ))}
            </View>
        );
    };

    const renderNumberPad = () => {
        const numbers = [
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
            [isBiometricEnabled ? 'biometric' : '', '0', 'delete'],
        ];

        return (
            <View style={styles.numberPad}>
                {numbers.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.numberRow}>
                        {row.map((num, numIndex) => {
                            if (num === '') {
                                return <View key={numIndex} style={styles.numberButton} />;
                            }

                            if (num === 'delete') {
                                return (
                                    <TouchableOpacity
                                        key={numIndex}
                                        style={styles.numberButton}
                                        onPress={handleDelete}
                                        disabled={pin.length === 0}
                                    >
                                        <Ionicons
                                            name="backspace-outline"
                                            size={28}
                                            color={pin.length > 0 ? colors.text : colors.border}
                                        />
                                    </TouchableOpacity>
                                );
                            }

                            if (num === 'biometric') {
                                return (
                                    <TouchableOpacity
                                        key={numIndex}
                                        style={styles.numberButton}
                                        onPress={handleBiometricAuth}
                                    >
                                        <Ionicons
                                            name={getBiometricIcon()}
                                            size={28}
                                            color={colors.tint}
                                        />
                                    </TouchableOpacity>
                                );
                            }

                            return (
                                <TouchableOpacity
                                    key={numIndex}
                                    style={[styles.numberButton, { backgroundColor: colors.surface }]}
                                    onPress={() => handleNumberPress(num)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.numberText, { color: colors.text }]}>
                                        {num}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ))}
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Content */}
            <View style={styles.content}>
                <View style={[styles.iconContainer, { backgroundColor: colors.tint + '15' }]}>
                    <Ionicons name="lock-closed" size={40} color={colors.tint} />
                </View>

                <Text style={[styles.title, { color: colors.text }]}>Hoş Geldiniz</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Devam etmek için PIN kodunuzu girin
                </Text>

                {renderDots()}

                {error ? (
                    <Text style={[styles.errorText, { color: colors.expense }]}>{error}</Text>
                ) : (
                    <View style={styles.errorPlaceholder} />
                )}
            </View>

            {/* Number Pad */}
            {renderNumberPad()}

            {/* Biometric hint */}
            {isBiometricEnabled && biometricType && (
                <TouchableOpacity
                    style={styles.biometricHint}
                    onPress={handleBiometricAuth}
                >
                    <Ionicons name={getBiometricIcon()} size={20} color={colors.tint} />
                    <Text style={[styles.biometricHintText, { color: colors.tint }]}>
                        {getBiometricLabel()}
                    </Text>
                </TouchableOpacity>
            )}

            {/* Forgot PIN button */}
            <TouchableOpacity
                style={styles.forgotPinButton}
                onPress={handleForgotPin}
                disabled={resetting}
            >
                <Text style={[styles.forgotPinText, { color: colors.tint }]}>
                    Şifremi Unuttum
                </Text>
            </TouchableOpacity>

            {/* Loading overlay */}
            {resetting && (
                <View style={styles.loadingOverlay}>
                    <View style={[styles.loadingContainer, { backgroundColor: colors.surface }]}>
                        <ActivityIndicator size="large" color={colors.tint} />
                        <Text style={[styles.loadingText, { color: colors.text }]}>
                            Veriler sıfırlanıyor...
                        </Text>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 32,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '600',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        marginBottom: 32,
        textAlign: 'center',
        paddingHorizontal: 32,
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 16,
    },
    dot: {
        width: 16,
        height: 16,
        borderRadius: 8,
    },
    errorText: {
        fontSize: 14,
        fontWeight: '500',
        height: 20,
    },
    errorPlaceholder: {
        height: 20,
    },
    numberPad: {
        paddingHorizontal: 48,
        paddingBottom: 24,
    },
    numberRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
        marginBottom: 16,
    },
    numberButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    numberText: {
        fontSize: 28,
        fontWeight: '500',
    },
    biometricHint: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingBottom: 32,
    },
    biometricHintText: {
        fontSize: 15,
        fontWeight: '500',
    },
    forgotPinButton: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    forgotPinText: {
        fontSize: 15,
        fontWeight: '500',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContainer: {
        padding: 32,
        borderRadius: 16,
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        fontSize: 16,
        fontWeight: '500',
    },
});
