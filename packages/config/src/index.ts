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
  name: {
    en: 'MIFTAH 360',
    ar: 'مفتاح 360',
  },
  slogan: {
    en: 'YOUR CAR. A SMARTER WAY.',
    ar: 'سيارتك . بطريقة أذكى',
  },
  colors: {
    // Official Miftah 360 Brand Palette
    primaryTeal: '#0E7C86', // اللون الأساسي Primary Teal
    lightTeal: '#4DD0E1', // سماوي فاتح Light Teal
    darkTeal: '#0A4D56', // سماوي / تيل غامق Dark Teal
    graphite: '#2B2E34', // رمادي غامق Graphite
    lightBackground: '#F2F5F7', // خلفية فاتحة Light Background
    silver: '#C9CDD3', // فضي للشعار والعناصر المميزة Silver Metallic
    deepDark: '#061E23', // خلفية داكنة فاخرة Deep Dark Teal
    white: '#FFFFFF',

    // System Functional Semantic Colors
    primary: '#0E7C86',
    primaryHover: '#0A4D56',
    secondary: '#4DD0E1',
    accent: '#0E7C86',
    success: '#22C55E', // النجاح / متاح
    warning: '#F59E0B', // تنبيه / قيد التنفيذ
    danger: '#EF4444', // خطأ / إلغاء
    error: '#EF4444',

    // Surface & Text
    backgroundLight: '#F2F5F7',
    surfaceLight: '#FFFFFF',
    textPrimaryLight: '#2B2E34',
    textSecondaryLight: '#6B7280',

    // Gradient definitions
    gradientTeal: 'linear-gradient(135deg, #0A4D56 0%, #0E7C86 50%, #4DD0E1 100%)',
    gradientSilver: 'linear-gradient(135deg, #C9CDD3 0%, #E5E7EB 50%, #9CA3AF 100%)',
  },
  typography: {
    fontFamilyArabic: "'Cairo', 'Tajawal', 'IBM Plex Sans Arabic', sans-serif",
    fontFamilyEnglish: "'Inter', sans-serif",
  },
  assets: {
    logoLight: '/brand/logo.jpg',
    logoDark: '/brand/logo-dark.jpg',
    splashHero: '/brand/splash-hero.jpg',
    palette: '/brand/palette.jpg',
  },
} as const;
