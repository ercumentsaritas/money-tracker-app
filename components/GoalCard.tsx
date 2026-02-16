import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Flag, Clock, Wallet, Calendar, ArrowsClockwise, Plus, PlusCircle } from 'phosphor-react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Goal } from '@/types';
import { addGoalDeposit } from '@/database';

interface GoalCardProps {
    goal: Goal;
    onDeposit?: () => void;
}

function getMonthsDiff(startDate: Date, endDate: Date): number {
    const yearDiff = endDate.getFullYear() - startDate.getFullYear();
    const monthDiff = endDate.getMonth() - startDate.getMonth();
    return Math.max(1, yearDiff * 12 + monthDiff);
}

export function GoalCard({ goal, onDeposit }: GoalCardProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const isDark = colorScheme === 'dark';

    const [showDepositModal, setShowDepositModal] = useState(false);
    const [depositAmount, setDepositAmount] = useState('');

    const progress = goal.target_amount > 0
        ? Math.min(100, (goal.current_amount / goal.target_amount) * 100)
        : 0;
    const remaining = goal.target_amount - goal.current_amount;

    const createdDate = new Date(goal.created_at);
    const deadlineDate = new Date(goal.deadline);
    const now = new Date();

    const totalMonths = getMonthsDiff(createdDate, deadlineDate);
    const elapsedMonths = getMonthsDiff(createdDate, now);
    const currentInstallment = Math.min(elapsedMonths + 1, totalMonths);

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR', {
            month: 'short',
            year: 'numeric',
        });
    };

    const handleDeposit = async () => {
        const amount = parseFloat(depositAmount);
        if (!amount || amount <= 0) {
            Alert.alert('Hata', 'Lütfen geçerli bir tutar girin');
            return;
        }

        try {
            await addGoalDeposit(goal.id, amount);
            setShowDepositModal(false);
            setDepositAmount('');
            onDeposit?.();
        } catch (error) {
            Alert.alert('Hata', 'Para yatırılamadı');
        }
    };

    // Calculate color based on progress - using sage green palette
    const getProgressColor = (): readonly [string, string] => {
        if (progress >= 75) return ['#4A7C59', '#6B9B6B'] as const; // Deep sage
        if (progress >= 50) return ['#5D7A5D', '#7A9A7A'] as const; // Sage green
        if (progress >= 25) return ['#C4A484', '#D4B896'] as const; // Warm taupe
        return ['#7A9A7A', '#8FAE8B'] as const; // Light sage
    };

    return (
        <>
            <View style={[
                styles.container,
                {
                    backgroundColor: colors.surface,
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                }
            ]}>
                {/* Header */}
                <View style={styles.header}>
                    <LinearGradient
                        colors={getProgressColor()}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.iconContainer}
                    >
                        <Flag size={20} color="#FFFFFF" weight="regular" />
                    </LinearGradient>
                    <View style={styles.titleContainer}>
                        <Text style={[styles.title, { color: colors.text }]}>{goal.name}</Text>
                        <View style={styles.deadlineRow}>
                            <Clock size={12} color={colors.textSecondary} weight="regular" />
                            <Text style={[styles.deadline, { color: colors.textSecondary }]}>
                                {formatDate(goal.deadline)}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.depositButton}
                        onPress={() => setShowDepositModal(true)}
                    >
                        <LinearGradient
                            colors={isDark ? ['#8FAE8B', '#5D7A5D'] : ['#5D7A5D', '#4A6B4A']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.depositButtonGradient}
                        >
                            <Plus size={18} color="#FFFFFF" weight="regular" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Progress Section */}
                <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                        <Text style={[styles.progressPercent, { color: colors.text }]}>
                            {Math.round(progress)}%
                        </Text>
                        <Text style={[styles.progressTarget, { color: colors.textSecondary }]}>
                            {formatAmount(goal.current_amount)} / {formatAmount(goal.target_amount)}
                        </Text>
                    </View>
                    <View style={[styles.progressBar, { backgroundColor: colors.surfaceAlt }]}>
                        <LinearGradient
                            colors={getProgressColor()}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.progressFill, { width: `${progress}%` }]}
                        />
                    </View>
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <View style={[styles.statCard, { backgroundColor: colors.surfaceAlt }]}>
                        <Wallet size={16} color={colors.income} weight="regular" />
                        <Text style={[styles.statValue, { color: colors.text }]}>
                            {formatAmount(remaining)}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Kalan</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: colors.surfaceAlt }]}>
                        <Calendar size={16} color={colors.tint} weight="regular" />
                        <Text style={[styles.statValue, { color: colors.text }]}>
                            {currentInstallment}/{totalMonths}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Ay</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: colors.surfaceAlt }]}>
                        <ArrowsClockwise size={16} color={colors.warning} weight="regular" />
                        <Text style={[styles.statValue, { color: colors.text }]}>
                            {formatAmount(goal.monthly_target)}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Aylık</Text>
                    </View>
                </View>
            </View>

            {/* Deposit Modal */}
            <Modal visible={showDepositModal} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setShowDepositModal(false)}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : (StatusBar.currentHeight || 0)}
                    style={{ flex: 1 }}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => {
                            Keyboard.dismiss();
                            setShowDepositModal(false);
                        }}
                    >
                        <View
                            style={[styles.modalContent, { backgroundColor: colors.surface }]}
                            onStartShouldSetResponder={() => true}
                        >
                            <View style={styles.modalHeader}>
                                <LinearGradient
                                    colors={['#5D7A5D', '#7A9A7A']}
                                    style={styles.modalIcon}
                                >
                                    <PlusCircle size={24} color="#FFFFFF" weight="regular" />
                                </LinearGradient>
                            </View>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Para Yatır</Text>
                            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                                "{goal.name}" hedefine
                            </Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: colors.surfaceAlt,
                                        color: colors.text,
                                        borderColor: colors.border,
                                    }
                                ]}
                                placeholder="₺0"
                                placeholderTextColor={colors.textSecondary}
                                value={depositAmount}
                                onChangeText={setDepositAmount}
                                keyboardType="numeric"
                                autoFocus
                            />
                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalButton, { backgroundColor: colors.surfaceAlt }]}
                                    onPress={() => setShowDepositModal(false)}
                                >
                                    <Text style={[styles.modalButtonText, { color: colors.text }]}>İptal</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.modalButtonPrimary}
                                    onPress={handleDeposit}
                                >
                                    <LinearGradient
                                        colors={['#5D7A5D', '#4A6B4A']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.modalButtonGradient}
                                    >
                                        <Plus size={18} color="#FFFFFF" weight="regular" />
                                        <Text style={styles.modalButtonTextWhite}>Yatır</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 24,
        borderWidth: 1,
        padding: 20,
        marginHorizontal: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleContainer: {
        flex: 1,
        marginLeft: 14,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    deadlineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    deadline: {
        fontSize: 12,
        fontWeight: '500',
    },
    depositButton: {
        borderRadius: 14,
        overflow: 'hidden',
    },
    depositButtonGradient: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressSection: {
        marginBottom: 20,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 10,
    },
    progressPercent: {
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -1,
    },
    progressTarget: {
        fontSize: 13,
        fontWeight: '500',
    },
    progressBar: {
        height: 10,
        borderRadius: 5,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 5,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    statCard: {
        flex: 1,
        padding: 12,
        borderRadius: 14,
        alignItems: 'center',
        gap: 6,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '700',
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        borderRadius: 28,
        padding: 28,
        width: '85%',
        maxWidth: 340,
        alignItems: 'center',
    },
    modalHeader: {
        marginBottom: 16,
    },
    modalIcon: {
        width: 56,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 4,
    },
    modalSubtitle: {
        fontSize: 14,
        marginBottom: 24,
    },
    input: {
        width: '100%',
        borderRadius: 16,
        borderWidth: 1,
        paddingHorizontal: 20,
        paddingVertical: 16,
        fontSize: 24,
        textAlign: 'center',
        fontWeight: '700',
        marginBottom: 24,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
    modalButtonPrimary: {
        flex: 1,
        borderRadius: 14,
        overflow: 'hidden',
    },
    modalButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 6,
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    modalButtonTextWhite: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
