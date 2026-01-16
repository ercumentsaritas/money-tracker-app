import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface FABProps {
    onPress: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
}

export function FAB({ onPress, icon = 'add' }: FABProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: colors.tint }]}
                onPress={onPress}
                activeOpacity={0.8}
            >
                <Ionicons name={icon} size={24} color="#FFFFFF" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        zIndex: 100,
    },
    fab: {
        width: 54,
        height: 54,
        borderRadius: 27,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
    },
});
