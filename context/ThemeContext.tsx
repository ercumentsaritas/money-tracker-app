import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { useColorScheme as useSystemColorScheme, Platform } from 'react-native';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    actualTheme: 'light' | 'dark';
    setTheme: (theme: Theme) => void;
    isOnboarded: boolean;
    setOnboarded: () => void;
    resetOnboarding: () => void;
    // PIN & Biometric
    isPinEnabled: boolean;
    isBiometricEnabled: boolean;
    isAuthenticated: boolean;
    setPin: (pin: string) => Promise<void>;
    removePin: () => Promise<void>;
    verifyPin: (pin: string) => Promise<boolean>;
    enableBiometric: (enable: boolean) => Promise<void>;
    authenticate: () => Promise<boolean>;
    authenticateWithBiometric: () => Promise<boolean>;
    setAuthenticated: (value: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'income_tracker_theme';
const ONBOARDED_KEY = 'income_tracker_onboarded';
const PIN_ENABLED_KEY = 'income_tracker_pin_enabled';
const BIOMETRIC_ENABLED_KEY = 'income_tracker_biometric_enabled';
const PIN_SECURE_KEY = 'income_tracker_pin';

export function ThemeProvider({ children }: { children: ReactNode }) {
    const systemColorScheme = useSystemColorScheme();
    const [theme, setThemeState] = useState<Theme>('light');
    const [isOnboarded, setIsOnboarded] = useState<boolean>(true); // Default true to not block
    const [isLoading, setIsLoading] = useState(true);

    // Security state
    const [isPinEnabled, setIsPinEnabled] = useState(false);
    const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(true); // Start authenticated until PIN is set up

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const [savedTheme, onboarded, pinEnabled, biometricEnabled] = await Promise.all([
                AsyncStorage.getItem(THEME_STORAGE_KEY),
                AsyncStorage.getItem(ONBOARDED_KEY),
                AsyncStorage.getItem(PIN_ENABLED_KEY),
                AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY),
            ]);

            if (savedTheme) {
                setThemeState(savedTheme as Theme);
            }
            setIsOnboarded(onboarded === 'true');

            const pinIsEnabled = pinEnabled === 'true';
            const bioIsEnabled = biometricEnabled === 'true';

            setIsPinEnabled(pinIsEnabled);
            setIsBiometricEnabled(bioIsEnabled);

            // If PIN is enabled, user needs to authenticate
            if (pinIsEnabled) {
                setIsAuthenticated(false);
            }
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

    // PIN Functions
    const setPin = async (pin: string) => {
        try {
            if (Platform.OS === 'web') {
                // On web, use AsyncStorage (less secure but functional)
                await AsyncStorage.setItem(PIN_SECURE_KEY, pin);
            } else {
                await SecureStore.setItemAsync(PIN_SECURE_KEY, pin);
            }
            await AsyncStorage.setItem(PIN_ENABLED_KEY, 'true');
            setIsPinEnabled(true);
            setIsAuthenticated(true);
        } catch (e) {
            console.error('Failed to set PIN:', e);
            throw e;
        }
    };

    const removePin = async () => {
        try {
            if (Platform.OS === 'web') {
                await AsyncStorage.removeItem(PIN_SECURE_KEY);
            } else {
                await SecureStore.deleteItemAsync(PIN_SECURE_KEY);
            }
            await AsyncStorage.removeItem(PIN_ENABLED_KEY);
            await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
            setIsPinEnabled(false);
            setIsBiometricEnabled(false);
            setIsAuthenticated(true);
        } catch (e) {
            console.error('Failed to remove PIN:', e);
        }
    };

    const verifyPin = async (pin: string): Promise<boolean> => {
        try {
            let storedPin: string | null;
            if (Platform.OS === 'web') {
                storedPin = await AsyncStorage.getItem(PIN_SECURE_KEY);
            } else {
                storedPin = await SecureStore.getItemAsync(PIN_SECURE_KEY);
            }
            const isValid = storedPin === pin;
            if (isValid) {
                setIsAuthenticated(true);
            }
            return isValid;
        } catch (e) {
            console.error('Failed to verify PIN:', e);
            return false;
        }
    };

    // Biometric Functions
    const enableBiometric = async (enable: boolean) => {
        try {
            if (enable) {
                // Check if device supports biometrics
                const compatible = await LocalAuthentication.hasHardwareAsync();
                const enrolled = await LocalAuthentication.isEnrolledAsync();

                if (!compatible || !enrolled) {
                    throw new Error('Biometric authentication not available');
                }
            }

            await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, enable ? 'true' : 'false');
            setIsBiometricEnabled(enable);
        } catch (e) {
            console.error('Failed to enable biometric:', e);
            throw e;
        }
    };

    const authenticateWithBiometric = async (): Promise<boolean> => {
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Kimliğinizi Doğrulayın',
                cancelLabel: 'İptal',
                fallbackLabel: 'PIN Kullan',
                disableDeviceFallback: true,
            });

            if (result.success) {
                setIsAuthenticated(true);
            }

            return result.success;
        } catch (e) {
            console.error('Biometric authentication failed:', e);
            return false;
        }
    };

    const authenticate = async (): Promise<boolean> => {
        if (isBiometricEnabled) {
            return await authenticateWithBiometric();
        }
        // If only PIN is enabled, return false to show PIN input
        return false;
    };

    const setAuthenticated = (value: boolean) => {
        setIsAuthenticated(value);
    };

    const actualTheme: 'light' | 'dark' =
        theme === 'system'
            ? (systemColorScheme ?? 'light')
            : theme;

    if (isLoading) {
        return null; // Or a loading spinner
    }

    return (
        <ThemeContext.Provider value={{
            theme,
            actualTheme,
            setTheme,
            isOnboarded,
            setOnboarded,
            resetOnboarding,
            isPinEnabled,
            isBiometricEnabled,
            isAuthenticated,
            setPin,
            removePin,
            verifyPin,
            enableBiometric,
            authenticate,
            authenticateWithBiometric,
            setAuthenticated,
        }}>
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
