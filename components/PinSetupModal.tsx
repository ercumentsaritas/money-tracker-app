import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Modal,
    Vibration,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface PinSetupModalProps {
    visible: boolean;
    onClose: () => void;
    onPinSet: (pin: string) => Promise<void>;
    title?: string;
    subtitle?: string;
}

export function PinSetupModal({
    visible,
    onClose,
    onPinSet,
    title = 'PIN Oluştur',
    subtitle = '6 haneli PIN kodunuzu girin',
}: PinSetupModalProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [step, setStep] = useState<'enter' | 'confirm'>('enter');
    const [error, setError] = useState('');

    const resetState = () => {
        setPin('');
        setConfirmPin('');
        setStep('enter');
        setError('');
    };

    useEffect(() => {
        if (!visible) {
            resetState();
        }
    }, [visible]);

    const handleNumberPress = (num: string) => {
        setError('');

        if (step === 'enter') {
            if (pin.length < 6) {
                const newPin = pin + num;
                setPin(newPin);

                if (newPin.length === 6) {
                    // Move to confirm step
                    setTimeout(() => {
                        setStep('confirm');
                    }, 200);
                }
            }
        } else {
            if (confirmPin.length < 6) {
                const newConfirmPin = confirmPin + num;
                setConfirmPin(newConfirmPin);

                if (newConfirmPin.length === 6) {
                    // Verify PINs match
                    if (newConfirmPin === pin) {
                        onPinSet(pin);
                    } else {
                        setError('PIN kodları eşleşmiyor');
                        if (Platform.OS !== 'web') {
                            Vibration.vibrate(100);
                        }
                        setConfirmPin('');
                    }
                }
            }
        }
    };

    const handleDelete = () => {
        if (step === 'enter') {
            setPin(pin.slice(0, -1));
        } else {
            setConfirmPin(confirmPin.slice(0, -1));
        }
        setError('');
    };

    const handleBack = () => {
        if (step === 'confirm') {
            setStep('enter');
            setConfirmPin('');
            setError('');
        } else {
            onClose();
        }
    };

    const currentPin = step === 'enter' ? pin : confirmPin;
    const currentTitle = step === 'enter' ? title : 'PIN\'i Onayla';
    const currentSubtitle = step === 'enter' ? subtitle : 'Aynı PIN kodunu tekrar girin';

    const renderDots = () => {
        return (
            <View style={styles.dotsContainer}>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            {
                                backgroundColor: index < currentPin.length
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
            ['', '0', 'delete'],
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
                                        disabled={currentPin.length === 0}
                                    >
                                        <Ionicons
                                            name="backspace-outline"
                                            size={28}
                                            color={currentPin.length > 0 ? colors.text : colors.border}
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
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={handleBack}
        >
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={[styles.headerButton, { backgroundColor: colors.surface }]}
                        onPress={handleBack}
                    >
                        <Ionicons name="arrow-back" size={22} color={colors.text} />
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    <View style={[styles.iconContainer, { backgroundColor: colors.tint + '15' }]}>
                        <Ionicons name="lock-closed-outline" size={40} color={colors.tint} />
                    </View>

                    <Text style={[styles.title, { color: colors.text }]}>{currentTitle}</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        {currentSubtitle}
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
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
    },
    headerButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        alignItems: 'center',
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
        paddingBottom: 48,
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
});
