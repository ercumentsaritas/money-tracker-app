import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';

export default function ReportsScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                <Ionicons name="pie-chart-outline" size={80} color={colors.textSecondary} />
                <Text style={[styles.title, { color: colors.text }]}>Raporlar</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Yakında: Aylık gelir/gider grafikleri{'\n'}ve kategori analizleri
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    title: {
        fontSize: 20,
        fontWeight: '300',
        marginTop: 24,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 14,
        marginTop: 12,
        textAlign: 'center',
        lineHeight: 22,
    },
});
