import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface CalendarPickerProps {
    visible: boolean;
    selectedDate: string; // YYYY-MM-DD format
    onDateSelect: (date: string) => void;
    onClose: () => void;
}

const DAYS_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const MONTHS_TR = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

export function CalendarPicker({ visible, selectedDate, onDateSelect, onClose }: CalendarPickerProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const [currentDate, setCurrentDate] = useState(() => {
        const date = new Date(selectedDate);
        return { year: date.getFullYear(), month: date.getMonth() };
    });

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        const day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1; // Convert to Monday-based
    };

    const generateCalendarDays = () => {
        const daysInMonth = getDaysInMonth(currentDate.year, currentDate.month);
        const firstDay = getFirstDayOfMonth(currentDate.year, currentDate.month);
        const days: (number | null)[] = [];

        // Add empty cells for days before the first day of month
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }

        // Add days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }

        return days;
    };

    const handleDayPress = (day: number) => {
        const month = String(currentDate.month + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        const dateStr = `${currentDate.year}-${month}-${dayStr}`;
        onDateSelect(dateStr);
        onClose();
    };

    const goToPreviousMonth = () => {
        setCurrentDate(prev => {
            if (prev.month === 0) {
                return { year: prev.year - 1, month: 11 };
            }
            return { ...prev, month: prev.month - 1 };
        });
    };

    const goToNextMonth = () => {
        setCurrentDate(prev => {
            if (prev.month === 11) {
                return { year: prev.year + 1, month: 0 };
            }
            return { ...prev, month: prev.month + 1 };
        });
    };

    const isSelectedDay = (day: number) => {
        const selectedParts = selectedDate.split('-');
        return (
            parseInt(selectedParts[0]) === currentDate.year &&
            parseInt(selectedParts[1]) - 1 === currentDate.month &&
            parseInt(selectedParts[2]) === day
        );
    };

    const isToday = (day: number) => {
        const today = new Date();
        return (
            today.getFullYear() === currentDate.year &&
            today.getMonth() === currentDate.month &&
            today.getDate() === day
        );
    };

    const days = generateCalendarDays();

    return (
        <Modal visible={visible} transparent animationType="fade">
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <View
                    style={[styles.container, { backgroundColor: colors.surface }]}
                    onStartShouldSetResponder={() => true}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
                            <Ionicons name="chevron-back" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={[styles.headerText, { color: colors.text }]}>
                            {MONTHS_TR[currentDate.month]} {currentDate.year}
                        </Text>
                        <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
                            <Ionicons name="chevron-forward" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Day names */}
                    <View style={styles.weekRow}>
                        {DAYS_TR.map((day) => (
                            <View key={day} style={styles.dayCell}>
                                <Text style={[styles.dayName, { color: colors.textSecondary }]}>
                                    {day}
                                </Text>
                            </View>
                        ))}
                    </View>

                    {/* Calendar grid */}
                    <View style={styles.daysGrid}>
                        {days.map((day, index) => (
                            <View key={index} style={styles.dayCell}>
                                {day !== null && (
                                    <TouchableOpacity
                                        style={[
                                            styles.dayButton,
                                            isSelectedDay(day) && { backgroundColor: colors.tint },
                                            isToday(day) && !isSelectedDay(day) && { borderColor: colors.tint, borderWidth: 1 },
                                        ]}
                                        onPress={() => handleDayPress(day)}
                                    >
                                        <Text
                                            style={[
                                                styles.dayText,
                                                { color: isSelectedDay(day) ? '#FFFFFF' : colors.text },
                                            ]}
                                        >
                                            {day}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}
                    </View>

                    {/* Footer */}
                    <View style={[styles.footer, { borderTopColor: colors.border }]}>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={[styles.cancelButton, { color: colors.textSecondary }]}>İptal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => {
                            const today = new Date();
                            const dateStr = today.toISOString().split('T')[0];
                            onDateSelect(dateStr);
                            onClose();
                        }}>
                            <Text style={[styles.todayButton, { color: colors.tint }]}>Bugün</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        borderRadius: 20,
        padding: 16,
        width: 320,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    navButton: {
        padding: 8,
    },
    headerText: {
        fontSize: 17,
        fontWeight: '600',
    },
    weekRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: '14.28%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayName: {
        fontSize: 12,
        fontWeight: '500',
    },
    dayButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayText: {
        fontSize: 15,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
    },
    cancelButton: {
        fontSize: 15,
        fontWeight: '500',
    },
    todayButton: {
        fontSize: 15,
        fontWeight: '600',
    },
});
