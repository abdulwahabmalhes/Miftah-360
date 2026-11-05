export const PLATFORM_CONFIG = {
  currency: 'AED',
  displayTimezone: 'Asia/Dubai',
  supportedLanguages: ['ar', 'en'] as const,
  defaultLanguage: 'ar' as const,
  launchEmirates: ['DUBAI', 'SHARJAH'] as const,
  apiPrefix: '/api/v1',
  quoteExpiryDays: 7,
  bookingDefaultSlotDurationMinutes: 60,
  taxRatePercent: 5.0, // UAE standard VAT 5%
} as const;

export const BRAND_TOKENS = {
  colors: {
    primary: '#1E3A8A', // Miftah Blue
    primaryHover: '#172554',
    secondary: '#D97706', // Miftah Amber / Gold Accent
    accent: '#10B981', // Success / Green
    danger: '#EF4444', // Danger / Red
    warning: '#F59E0B', // Warning / Yellow
    backgroundLight: '#F8FAFC',
    surfaceLight: '#FFFFFF',
    textPrimaryLight: '#0F172A',
    textSecondaryLight: '#64748B',
  },
  typography: {
    fontFamilyArabic: "'IBM Plex Sans Arabic', 'Tajawal', sans-serif",
    fontFamilyEnglish: "'Inter', sans-serif",
  },
} as const;

