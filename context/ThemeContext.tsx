import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useSystemColorScheme } from 'react-native';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    actualTheme: 'light' | 'dark';
    setTheme: (theme: Theme) => void;
    isOnboarded: boolean;
    setOnboarded: () => void;
    resetOnboarding: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'income_tracker_theme';
const ONBOARDED_KEY = 'income_tracker_onboarded';

export function ThemeProvider({ children }: { children: ReactNode }) {
    const systemColorScheme = useSystemColorScheme();
    const [theme, setThemeState] = useState<Theme>('light');
    const [isOnboarded, setIsOnboarded] = useState<boolean>(true); // Default true to not block
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const [savedTheme, onboarded] = await Promise.all([
                AsyncStorage.getItem(THEME_STORAGE_KEY),
                AsyncStorage.getItem(ONBOARDED_KEY),
            ]);

            if (savedTheme) {
                setThemeState(savedTheme as Theme);
            }
            setIsOnboarded(onboarded === 'true');
        } catch (e) {
            console.error('Failed to load theme settings:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const setTheme = async (newTheme: Theme) => {
        setThemeState(newTheme);
        try {
            await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
        } catch (e) {
            console.error('Failed to save theme:', e);
        }
    };

    const setOnboarded = async () => {
        setIsOnboarded(true);
        try {
            await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
        } catch (e) {
            console.error('Failed to save onboarded state:', e);
        }
    };

    const resetOnboarding = async () => {
        setIsOnboarded(false);
        try {
            await AsyncStorage.removeItem(ONBOARDED_KEY);
        } catch (e) {
            console.error('Failed to reset onboarding:', e);
        }
    };

    const actualTheme: 'light' | 'dark' =
        theme === 'system'
            ? (systemColorScheme ?? 'light')
            : theme;

    if (isLoading) {
        return null; // Or a loading spinner
    }

    return (
        <ThemeContext.Provider value={{ theme, actualTheme, setTheme, isOnboarded, setOnboarded, resetOnboarding }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
