import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { resetDatabase } from '@/database';

interface SettingItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    danger?: boolean;
    rightElement?: React.ReactNode;
}

function SettingItem({ icon, title, subtitle, onPress, danger, rightElement }: SettingItemProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    return (
        <TouchableOpacity
            style={[styles.settingItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={onPress}
            disabled={!onPress && !rightElement}
        >
            <View style={[styles.iconContainer, { backgroundColor: danger ? colors.expense + '20' : colors.tint + '20' }]}>
                <Ionicons name={icon} size={22} color={danger ? colors.expense : colors.tint} />
            </View>
            <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: danger ? colors.expense : colors.text }]}>
                    {title}
                </Text>
                {subtitle && (
                    <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                        {subtitle}
                    </Text>
                )}
            </View>
            {rightElement ? rightElement : <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />}
        </TouchableOpacity>
    );
}

export default function SettingsScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const { theme, setTheme } = useTheme();

    const handleResetDatabase = async () => {
        // Use window.confirm for web compatibility
        const confirmed = typeof window !== 'undefined' && window.confirm
            ? window.confirm('Tüm veriler silinecek. Bu işlem geri alınamaz. Emin misiniz?')
            : true;

        if (confirmed) {
            await resetDatabase();
            if (typeof window !== 'undefined' && window.alert) {
                window.alert('Veritabanı sıfırlandı.');
            } else {
                Alert.alert('Başarılı', 'Veritabanı sıfırlandı.');
            }
        }
    };

    const handleThemeChange = () => {
        // Cycle through themes: light -> dark -> system -> light
        const themeOrder = ['light', 'dark', 'system'] as const;
        const currentIndex = themeOrder.indexOf(theme);
        const nextIndex = (currentIndex + 1) % themeOrder.length;
        setTheme(themeOrder[nextIndex]);
    };

    const getThemeLabel = () => {
        switch (theme) {
            case 'light': return 'Açık';
            case 'dark': return 'Koyu';
            case 'system': return 'Sistem';
            default: return 'Açık';
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>GÖRÜNÜM</Text>

            <SettingItem
                icon={theme === 'dark' ? 'moon' : 'sunny-outline'}
                title="Tema"
                subtitle={getThemeLabel()}
                onPress={handleThemeChange}
            />

            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>GENEL</Text>

            <SettingItem
                icon="wallet-outline"
                title="Hesaplar"
                subtitle="Nakit, banka hesapları"
                onPress={() => router.push('/accounts')}
            />
            <SettingItem
                icon="pricetags-outline"
                title="Kategoriler"
                subtitle="Gelir ve gider kategorileri"
                onPress={() => router.push('/categories')}
            />
            <SettingItem
                icon="repeat-outline"
                title="Tekrarlayan İşlemler"
                subtitle="Maaş, faturalar, abonelikler"
                onPress={() => router.push('/recurring')}
            />

            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ENTEGRASYONLAR</Text>

            <SettingItem
                icon="calendar-outline"
                title="Google Takvim"
                subtitle="Ödeme hatırlatıcıları"
                onPress={() => Alert.alert('Yakında', 'Bu özellik yakında eklenecek.')}
            />
            <SettingItem
                icon="cloud-outline"
                title="Bulut Senkronizasyonu"
                subtitle="Verilerinizi yedekleyin"
                onPress={() => Alert.alert('Yakında', 'Bu özellik yakında eklenecek.')}
            />

            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>VERİ</Text>

            <SettingItem
                icon="download-outline"
                title="Dışa Aktar"
                subtitle="CSV veya PDF olarak"
                onPress={() => Alert.alert('Yakında', 'Bu özellik yakında eklenecek.')}
            />
            <SettingItem
                icon="trash-outline"
                title="Veritabanını Sıfırla"
                subtitle="Tüm verileri sil"
                onPress={handleResetDatabase}
                danger
            />

            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>GELİŞTİRİCİ</Text>

            <SettingItem
                icon="flask-outline"
                title="Test Alanı"
                subtitle="Tüm fonksiyonları test et"
                onPress={() => router.push('/dev')}
            />

            <View style={styles.footer}>
                <Text style={[styles.version, { color: colors.textSecondary }]}>
                    Gelir Gider Takip v1.0.0
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        marginHorizontal: 20,
        marginTop: 24,
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        marginHorizontal: 16,
        marginVertical: 3,
        borderRadius: 14,
        borderWidth: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingContent: {
        flex: 1,
        marginLeft: 12,
    },
    settingTitle: {
        fontSize: 15,
        fontWeight: '500',
    },
    settingSubtitle: {
        fontSize: 12,
        marginTop: 3,
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    version: {
        fontSize: 13,
    },
});
