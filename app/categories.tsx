import React, { useState, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    FlatList,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getAllCategories, initDatabase } from '@/database';
import { Category, TransactionType } from '@/types';
import { AddCategoryModal } from '@/components/AddCategoryModal';

export default function CategoriesScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const [categories, setCategories] = useState<Category[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [addType, setAddType] = useState<TransactionType>('expense');
    const [activeTab, setActiveTab] = useState<TransactionType>('expense');

    const loadCategories = useCallback(async () => {
        await initDatabase();
        const cats = await getAllCategories();
        setCategories(cats);
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadCategories();
        }, [loadCategories])
    );

    const filteredCategories = categories.filter(c => c.type === activeTab);

    const handleAddCategory = (type: TransactionType) => {
        setAddType(type);
        setShowAddModal(true);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Kategoriler</Text>
                <TouchableOpacity onPress={() => handleAddCategory(activeTab)}>
                    <Ionicons name="add" size={24} color={colors.tint} />
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={[styles.tabsContainer, { backgroundColor: colors.surface }]}>
                <TouchableOpacity
                    style={[
                        styles.tab,
                        activeTab === 'expense' && { backgroundColor: colors.expense + '15', borderColor: colors.expense },
                    ]}
                    onPress={() => setActiveTab('expense')}
                >
                    <Text style={[styles.tabText, { color: activeTab === 'expense' ? colors.expense : colors.textSecondary }]}>
                        Gider
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.tab,
                        activeTab === 'income' && { backgroundColor: colors.income + '15', borderColor: colors.income },
                    ]}
                    onPress={() => setActiveTab('income')}
                >
                    <Text style={[styles.tabText, { color: activeTab === 'income' ? colors.income : colors.textSecondary }]}>
                        Gelir
                    </Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={filteredCategories}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <View
                        style={[styles.categoryItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                            <Ionicons name={item.icon as any} size={22} color={item.color} />
                        </View>
                        <Text style={[styles.categoryName, { color: colors.text }]}>{item.name}</Text>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            Bu tipte kategori yok
                        </Text>
                    </View>
                }
            />

            <AddCategoryModal
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
                onCategoryAdded={loadCategories}
                type={addType}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
    },
    tabsContainer: {
        flexDirection: 'row',
        padding: 12,
        gap: 10,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'transparent',
        alignItems: 'center',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
    },
    list: {
        padding: 16,
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 8,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    categoryName: {
        fontSize: 15,
        fontWeight: '500',
        marginLeft: 14,
    },
    empty: {
        alignItems: 'center',
        paddingVertical: 48,
    },
    emptyText: {
        fontSize: 15,
    },
});
