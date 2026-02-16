import React, { useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Animated,
    Dimensions,
    TouchableWithoutFeedback,
    Modal,
} from 'react-native';
import {
    House, ArrowsLeftRight, Calendar, Sparkle, Gear,
    Wallet, ArrowsClockwise, Tag, X, Flask, CreditCard
} from 'phosphor-react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SideDrawerProps {
    visible: boolean;
    onClose: () => void;
}

const DRAWER_WIDTH = Dimensions.get('window').width * 0.78;

interface MenuItem {
    icon: React.ComponentType<any>;
    label: string;
    route: string;
    section?: string;
}

const MENU_ITEMS: MenuItem[] = [
    { section: 'GENEL', icon: House, label: 'Ana Sayfa', route: '/(tabs)' },
    { icon: ArrowsLeftRight, label: 'İşlemler', route: '/(tabs)/transactions' },
    { icon: Calendar, label: 'Takvim', route: '/(tabs)/calendar' },
    { icon: Sparkle, label: 'AI Asistan', route: '/(tabs)/ai-chat' },
    { section: 'YÖNETİM', icon: Wallet, label: 'Hesaplar', route: '/accounts' },
    { icon: Tag, label: 'Kategoriler', route: '/categories' },
    { icon: CreditCard, label: 'Borçlar', route: '/debts' },
    { icon: ArrowsClockwise, label: 'Tekrarlayan İşlemler', route: '/recurring' },
    { section: 'DİĞER', icon: Gear, label: 'Ayarlar', route: '/(tabs)/settings' },
    { icon: Flask, label: 'Test Alanı', route: '/dev' },
];

export function SideDrawer({ visible, onClose }: SideDrawerProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets();
    const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    damping: 25,
                    stiffness: 200,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: -DRAWER_WIDTH,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    const handleNavigate = (route: string) => {
        onClose();
        setTimeout(() => {
            router.push(route as any);
        }, 250);
    };

    if (!visible) return null;

    let currentSection = '';

    return (
        <Modal transparent visible={visible} animationType="none" statusBarTranslucent onRequestClose={onClose}>
            <View style={styles.overlay}>
                {/* Background overlay */}
                <TouchableWithoutFeedback onPress={onClose}>
                    <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
                </TouchableWithoutFeedback>

                {/* Drawer panel */}
                <Animated.View
                    style={[
                        styles.drawer,
                        {
                            backgroundColor: colors.surface,
                            width: DRAWER_WIDTH,
                            paddingTop: insets.top + 16,
                            transform: [{ translateX: slideAnim }],
                        },
                    ]}
                >
                    {/* Header */}
                    <View style={styles.drawerHeader}>
                        <View>
                            <Text style={[styles.appName, { color: colors.text }]}>
                                Gelir Takip
                            </Text>
                            <Text style={[styles.appVersion, { color: colors.textSecondary }]}>
                                v1.0.0
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.closeButton, { backgroundColor: colors.surfaceAlt }]}
                            onPress={onClose}
                        >
                            <X size={18} color={colors.textSecondary} weight="regular" />
                        </TouchableOpacity>
                    </View>

                    {/* Divider */}
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    {/* Menu Items */}
                    <View style={styles.menuList}>
                        {MENU_ITEMS.map((item, index) => {
                            const showSection = item.section && item.section !== currentSection;
                            if (item.section) currentSection = item.section;
                            const Icon = item.icon;

                            return (
                                <View key={index}>
                                    {showSection && (
                                        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                                            {item.section}
                                        </Text>
                                    )}
                                    <TouchableOpacity
                                        style={styles.menuItem}
                                        onPress={() => handleNavigate(item.route)}
                                        activeOpacity={0.6}
                                    >
                                        <View style={[styles.menuIcon, { backgroundColor: colors.tint + '10' }]}>
                                            <Icon size={18} color={colors.tint} weight="light" />
                                        </View>
                                        <Text style={[styles.menuLabel, { color: colors.text }]}>
                                            {item.label}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        flexDirection: 'row',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    drawer: {
        height: '100%',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
    },
    drawerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    appName: {
        fontSize: 22,
        fontFamily: 'DMSerifDisplay_400Regular',
    },
    appVersion: {
        fontSize: 12,
        fontFamily: 'Outfit_400Regular',
        marginTop: 2,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        marginHorizontal: 24,
        marginBottom: 8,
    },
    menuList: {
        paddingHorizontal: 16,
        paddingTop: 4,
    },
    sectionLabel: {
        fontSize: 11,
        fontFamily: 'Outfit_600SemiBold',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginTop: 20,
        marginBottom: 8,
        marginLeft: 12,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 11,
        paddingHorizontal: 12,
        borderRadius: 12,
        gap: 14,
    },
    menuIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuLabel: {
        fontSize: 15,
        fontFamily: 'Outfit_500Medium',
    },
});
