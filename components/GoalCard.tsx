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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Goal } from '@/types';
import { addGoalDeposit } from '@/database';

interface GoalCardProps {
    goal: Goal;
    onDeposit?: () => void;
}

// Helper function for accurate month calculation
function getMonthsDiff(startDate: Date, endDate: Date): number {
    const yearDiff = endDate.getFullYear() - startDate.getFullYear();
    const monthDiff = endDate.getMonth() - startDate.getMonth();
    return Math.max(1, yearDiff * 12 + monthDiff);
}

export function GoalCard({ goal, onDeposit }: GoalCardProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const [showDepositModal, setShowDepositModal] = useState(false);
    const [depositAmount, setDepositAmount] = useState('');

    // Prevent division by zero
    const progress = goal.target_amount > 0
        ? Math.min(100, (goal.current_amount / goal.target_amount) * 100)
        : 0;
    const remaining = goal.target_amount - goal.current_amount;

    // Calculate months info with proper date arithmetic
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

    return (
        <>
            <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.header}>
                    <View style={[styles.iconContainer, { backgroundColor: colors.tint + '15' }]}>
                        <Ionicons name="flag" size={18} color={colors.tint} />
                    </View>
                    <View style={styles.titleContainer}>
                        <Text style={[styles.title, { color: colors.text }]}>{goal.name}</Text>
                        <Text style={[styles.deadline, { color: colors.textSecondary }]}>
                            Hedef: {formatDate(goal.deadline)}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.depositButton, { backgroundColor: colors.tint }]}
                        onPress={() => setShowDepositModal(true)}
                    >
                        <Ionicons name="add" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                {/* Progress Bar */}
                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                    <View
                        style={[
                            styles.progressFill,
                            { backgroundColor: colors.tint, width: `${progress}%` },
                        ]}
                    />
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.stat}>
                        <Text style={[styles.statValue, { color: colors.text }]}>
                            {formatAmount(goal.current_amount)}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Biriktirilen</Text>
                    </View>
                    <View style={styles.stat}>
                        <Text style={[styles.statValue, { color: colors.text }]}>
                            {formatAmount(remaining)}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Kalan</Text>
                    </View>
                    <View style={styles.stat}>
                        <Text style={[styles.statValue, { color: colors.text }]}>
                            {currentInstallment}/{totalMonths}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Taksit</Text>
                    </View>
                </View>

                {/* Monthly Target Reminder */}
                <View style={[styles.reminder, { backgroundColor: colors.tint + '10' }]}>
                    <Ionicons name="notifications-outline" size={16} color={colors.tint} />
                    <Text style={[styles.reminderText, { color: colors.tint }]}>
                        Bu ay {formatAmount(goal.monthly_target)} yatırmanız gerekiyor
                    </Text>
                </View>
            </View>

            {/* Deposit Modal */}
            <Modal visible={showDepositModal} transparent animationType="fade">
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
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Para Yatır</Text>
                        <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                            "{goal.name}" hedefine ne kadar yatırmak istiyorsunuz?
                        </Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
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
                                style={[styles.modalButton, { backgroundColor: colors.tint }]}
                                onPress={handleDeposit}
                            >
                                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Yatır</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 12,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleContainer: {
        flex: 1,
        marginLeft: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
    },
    deadline: {
        fontSize: 12,
        marginTop: 2,
    },
    depositButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 14,
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    stat: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    statLabel: {
        fontSize: 11,
        marginTop: 2,
    },
    reminder: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 10,
        borderRadius: 10,
    },
    reminderText: {
        fontSize: 12,
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        borderRadius: 20,
        padding: 24,
        width: 300,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 13,
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 20,
        textAlign: 'center',
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
});
