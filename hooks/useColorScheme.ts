import { useTheme } from '@/context/ThemeContext';

export function useColorScheme() {
    try {
        const { actualTheme } = useTheme();
        return actualTheme;
    } catch {
        // Fallback if ThemeContext is not available
        return 'light';
    }
}

