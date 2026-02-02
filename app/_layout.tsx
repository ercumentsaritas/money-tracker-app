import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { processRecurringTransactions } from '@/database';
import AuthScreen from './auth';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <RootLayoutNav />
    </ThemeProvider>
  );
}

function RootLayoutNav() {
  const { actualTheme, isOnboarded, isPinEnabled, isAuthenticated } = useTheme();

  useEffect(() => {
    if (!isOnboarded) {
      router.replace('/onboarding');
    }
  }, [isOnboarded]);

  // Process recurring transactions when app loads and user is authenticated
  useEffect(() => {
    if (isOnboarded && isAuthenticated) {
      processRecurringTransactions().then((count) => {
        if (count > 0) {
          console.log(`[App] Processed ${count} recurring transaction(s)`);
        }
      }).catch((error) => {
        console.error('[App] Failed to process recurring transactions:', error);
      });
    }
  }, [isOnboarded, isAuthenticated]);

  // Show auth screen if PIN is enabled but user is not authenticated
  if (isPinEnabled && !isAuthenticated && isOnboarded) {
    return (
      <NavigationThemeProvider value={actualTheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthScreen />
      </NavigationThemeProvider>
    );
  }

  return (
    <NavigationThemeProvider value={actualTheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="add-transaction" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="accounts" options={{ headerShown: false }} />
        <Stack.Screen name="categories" options={{ headerShown: false }} />
        <Stack.Screen name="recurring" options={{ headerShown: false }} />
        <Stack.Screen name="dev" options={{ headerShown: false }} />
        <Stack.Screen name="account-detail" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </NavigationThemeProvider>
  );
}
