import React, { useState } from 'react';
import {
    Modal,
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { addCategory } from '@/database';
import { TransactionType } from '@/types';

interface AddCategoryModalProps {
    visible: boolean;
    onClose: () => void;
    onCategoryAdded: () => void;
    type: TransactionType;
}

const PRESET_COLORS = [
    '#A68B6A', '#6B9F78', '#C97B7B', '#7BA3C9', '#C9A87B',
    '#9F6B8F', '#6B9F9F', '#C98B7B', '#8F9F6B', '#7B7BC9',
];

const PRESET_ICONS = [
    'wallet', 'card', 'cash', 'cart', 'bag', 'basket',
    'restaurant', 'cafe', 'car', 'bus', 'airplane', 'home',
    'medical', 'fitness', 'book', 'school', 'briefcase', 'laptop',
    'gift', 'heart', 'star', 'diamond', 'trophy', 'ribbon',
];

export function AddCategoryModal({ visible, onClose, onCategoryAdded, type }: AddCategoryModalProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const [name, setName] = useState('');
    const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
    const [selectedIcon, setSelectedIcon] = useState(PRESET_ICONS[0]);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) return;

        setSaving(true);
        try {
            await addCategory({
                name: name.trim(),
                type,
                color: selectedColor,
                icon: selectedIcon,
            });
            onCategoryAdded();
            handleClose();
        } catch (error) {
            console.error('Failed to add category:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        setName('');
        setSelectedColor(PRESET_COLORS[0]);
        setSelectedIcon(PRESET_ICONS[0]);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                style={styles.overlay}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={[styles.container, { backgroundColor: colors.surface }]}>
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <TouchableOpacity onPress={handleClose}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={[styles.title, { color: colors.text }]}>
                            Yeni Kategori
                        </Text>
                        <TouchableOpacity onPress={handleSave} disabled={!name.trim() || saving}>
                            <Text style={[
                                styles.saveButton,
                                { color: name.trim() ? colors.tint : colors.textSecondary }
                            ]}>
                                Kaydet
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content}>
                        {/* Category Name */}
                        <View style={[styles.inputCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>KATEGORI ADI</Text>
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                value={name}
                                onChangeText={setName}
                                placeholder="Örn: Market"
                                placeholderTextColor={colors.textSecondary}
                                autoFocus
                            />
                        </View>

                        {/* Color Picker */}
                        <View style={[styles.inputCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>RENK</Text>
                            <View style={styles.colorGrid}>
                                {PRESET_COLORS.map((color) => (
                                    <TouchableOpacity
                                        key={color}
                                        style={[
                                            styles.colorOption,
                                            { backgroundColor: color },
                                            selectedColor === color && styles.colorSelected,
                                        ]}
                                        onPress={() => setSelectedColor(color)}
                                    >
                                        {selectedColor === color && (
                                            <Ionicons name="checkmark" size={18} color="#FFF" />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Icon Picker */}
                        <View style={[styles.inputCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>IKON</Text>
                            <View style={styles.iconGrid}>
                                {PRESET_ICONS.map((icon) => (
                                    <TouchableOpacity
                                        key={icon}
                                        style={[
                                            styles.iconOption,
                                            {
                                                backgroundColor: selectedIcon === icon ? selectedColor + '20' : 'transparent',
                                                borderColor: selectedIcon === icon ? selectedColor : colors.border,
                                            },
                                        ]}
                                        onPress={() => setSelectedIcon(icon)}
                                    >
                                        <Ionicons
                                            name={icon as any}
                                            size={22}
                                            color={selectedIcon === icon ? selectedColor : colors.textSecondary}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Preview */}
                        <View style={[styles.preview, { backgroundColor: colors.background, borderColor: colors.border }]}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>ÖNIZLEME</Text>
                            <View style={styles.previewContent}>
                                <View style={[styles.previewIcon, { backgroundColor: selectedColor + '20' }]}>
                                    <Ionicons name={selectedIcon as any} size={24} color={selectedColor} />
                                </View>
                                <Text style={[styles.previewName, { color: colors.text }]}>
                                    {name || 'Kategori Adı'}
                                </Text>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
    },
    saveButton: {
        fontSize: 14,
        fontWeight: '500',
    },
    content: {
        padding: 16,
    },
    inputCard: {
        borderRadius: 14,
        borderWidth: 1,
        padding: 14,
        marginBottom: 12,
    },
    label: {
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.5,
        marginBottom: 10,
    },
    input: {
        fontSize: 16,
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    colorOption: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    colorSelected: {
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    iconGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    iconOption: {
        width: 44,
        height: 44,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    preview: {
        borderRadius: 14,
        borderWidth: 1,
        padding: 14,
        marginBottom: 24,
    },
    previewContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    previewIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewName: {
        fontSize: 16,
        fontWeight: '500',
    },
});
