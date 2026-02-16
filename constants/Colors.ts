// App color constants - Cream & Sage Minimal Palette
const tintColorLight = '#5B6F5B'; // Muted sage green
const tintColorDark = '#8FAE8B'; // Lighter sage for dark mode

export const Colors = {
  light: {
    text: '#1A1A1A',
    textSecondary: '#8A8A80',
    background: '#EDEBE6', // Warm cream
    surface: '#F5F3EE', // Slightly lighter cream
    surfaceAlt: '#E8E5E0',
    tint: tintColorLight,
    tabIconDefault: '#B0AEA6',
    tabIconSelected: tintColorLight,
    border: '#DDD9D3',
    income: '#5B6F5B', // Sage green
    expense: '#B8A08A', // Warm taupe
    warning: '#C4A070', // Muted amber
    // Gradient colors
    gradientStart: '#5B6F5B',
    gradientEnd: '#7A9178',
    gradientIncome: '#5B6F5B',
    gradientIncomeEnd: '#7A9178',
    gradientExpense: '#B8A08A',
    gradientExpenseEnd: '#CCBB9F',
    // Card backgrounds
    cardGlass: 'rgba(245, 243, 238, 0.95)',
    cardOverlay: 'rgba(91, 111, 91, 0.04)',
  },
  dark: {
    text: '#F0EDE8',
    textSecondary: '#9CA3AF',
    background: '#1A1A1A',
    surface: '#242424',
    surfaceAlt: '#2E2E2E',
    tint: tintColorDark,
    tabIconDefault: '#6B7280',
    tabIconSelected: tintColorDark,
    border: '#3A3A3A',
    income: '#8FAE8B', // Light sage
    expense: '#D4B896', // Light taupe
    warning: '#E5C9A8', // Light amber
    // Gradient colors
    gradientStart: '#4A6B4A',
    gradientEnd: '#5D7A5D',
    gradientIncome: '#4A7C59',
    gradientIncomeEnd: '#6B9B6B',
    gradientExpense: '#B89A74',
    gradientExpenseEnd: '#C4A484',
    // Card backgrounds
    cardGlass: 'rgba(36, 36, 36, 0.9)',
    cardOverlay: 'rgba(143, 174, 139, 0.1)',
  },
};

export default Colors;
