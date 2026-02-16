import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Plus } from 'phosphor-react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FABProps {
    onPress: () => void;
}

export function FAB({ onPress }: FABProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const insets = useSafeAreaInsets();

    // Position above tab bar
    const bottomOffset = 16 + 65 + Math.max(0, insets.bottom);

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            style={[
                styles.fab,
                {
                    backgroundColor: colors.tint,
                    bottom: bottomOffset,
                }
            ]}
        >
            <Plus size={24} color="#FFFFFF" weight="light" />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        right: 20,
        width: 54,
        height: 54,
        borderRadius: 27,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#5B6F5B',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        zIndex: 100,
    },
});
