import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { House, ArrowsLeftRight, Calendar, Sparkle, Gear } from 'phosphor-react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

function TabBarIcon(props: {
  Icon: React.ComponentType<{ size: number; color: string; weight: 'thin' | 'light' | 'regular' | 'bold' | 'fill' }>;
  color: string;
  focused: boolean;
}) {
  return (
    <View style={styles.iconWrapper}>
      <props.Icon size={22} color={props.color} weight={props.focused ? 'regular' : 'light'} />
      {props.focused && <View style={[styles.indicator, { backgroundColor: props.color }]} />}
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
          backgroundColor: isDark ? colors.surface : colors.background,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
          elevation: Platform.OS === 'android' ? 8 : 0,
          shadowOpacity: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: 'Outfit_500Medium',
          marginTop: 2,
          letterSpacing: 0.2,
        },
        headerStyle: {
          backgroundColor: colors.background,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          fontFamily: 'Outfit_600SemiBold',
          fontSize: 18,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          headerShown: false,
          tabBarIcon: ({ color, focused }) => <TabBarIcon Icon={House} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'İşlemler',
          tabBarIcon: ({ color, focused }) => <TabBarIcon Icon={ArrowsLeftRight} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Takvim',
          tabBarIcon: ({ color, focused }) => <TabBarIcon Icon={Calendar} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="ai-chat"
        options={{
          title: 'AI',
          tabBarIcon: ({ color, focused }) => <TabBarIcon Icon={Sparkle} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ayarlar',
          tabBarIcon: ({ color, focused }) => <TabBarIcon Icon={Gear} color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    width: 16,
    height: 2.5,
    borderRadius: 1.5,
    marginTop: 4,
  },
});
