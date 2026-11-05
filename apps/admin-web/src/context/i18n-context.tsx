import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'ar' | 'en';

interface I18nContextType {
  language: Language;
  direction: 'rtl' | 'ltr';
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const DICTIONARY: Record<Language, Record<string, string>> = {
  ar: {
    // Navigation
    'nav.dashboard': 'لوحة التحكم',
    'nav.verificationQueue': 'قائمة التحقق من الورش',
    'nav.allWorkshops': 'إدارة الورش',
    'nav.modules': 'الموديولات والباقات',
    'nav.taxonomy': 'تصنيف الخدمات المعتمد',
    'nav.brands': 'الماركات والموديلات',
    'nav.logout': 'تسجيل الخروج',

    // Titles & Headers
    'app.title': 'لوحة إدارة مفتاح 360',
    'app.subtitle': 'منصة الحوكمة والتحكم بالورش والسوق المفتوح',
    'queue.title': 'طلبات التحقق من الورش الجديدة',
    'queue.empty': 'لا توجد ورش بانتظار التحقق حالياً.',
    'workshops.title': 'كافة الورش المسجلة',
    'modules.title': 'حوكمة الموديولات وحزمة السوق المفتوح (Marketplace Pack)',
    'taxonomy.title': 'تصنيف الخدمات V1 (25 خدمة معتمدة)',
    'brands.title': 'إدارة ماركات وموديلات المركبات',

    // Statuses
    'status.PENDING_VERIFICATION': 'قيد التحقق',
    'status.ACTIVE': 'نشط',
    'status.SUSPENDED': 'معلق',
    'status.INACTIVE': 'غير نشط',
    'status.REJECTED': 'مرفوض',

    // Actions
    'action.approve': 'اعتماد الورشة (تفعيل)',
    'action.reject': 'رفض الطلب',
    'action.suspend': 'تعليق الورشة',
    'action.reactivate': 'إعادة التنشيط',
    'action.deactivate': 'إيقاف كلي',
    'action.enable': 'تفعيل',
    'action.disable': 'تعطيل',
    'action.save': 'حفظ',
    'action.cancel': 'إلغاء',
    'action.viewDetails': 'عرض التفاصيل',
    'action.addBrand': 'إضافة ماركة جديدة',
    'action.addModel': 'إضافة موديل',
    'action.addService': 'إضافة خدمة قانونية',

    // Labels
    'label.reason': 'سبب الإجراء (مطلوب للتدقيق الرقابي)',
    'label.marketplaceParticipation': 'المشاركة في السوق المفتوح ومطابقة العملاء',
    'label.verifiedAt': 'تاريخ الاعتماد',
    'label.emirate': 'الإمارة',
    'label.phone': 'الهاتف الأساسي',
    'label.email': 'البريد الإلكتروني',
    'label.owner': 'مالك الورشة',
    'label.address': 'العنوان الجغرافي',
    'label.coreModule': 'نظام الورشة الأساسي (Core) - غير قابل للتعطيل',
    'label.marketplaceModule': 'حزمة السوق المفتوح (Marketplace Pack)',
    'label.inspectionPolicy': 'سياسة الفحص',
    'label.preliminaryQuote': 'يسمح بعرض سعر أولي',

    // Auth & MFA
    'auth.adminLogin': 'تسجيل دخول الإدارة',
    'auth.mfaRequired': 'رمز التحقق الثنائي (MFA/OTP) مطلوب',
    'auth.enterMfaCode': 'أدخل رمز الـ 6 أرقام للتحقق الإداري:',
    'auth.verify': 'تحقق ومتابعة',
    'auth.email': 'البريد الإلكتروني الإداري',
    'auth.password': 'كلمة المرور',
    'auth.loginBtn': 'تسجيل الدخول',

    // Common
    'common.loading': 'جاري التحميل...',
    'common.error': 'حدث خطأ في معالجة الطلب',
    'common.success': 'تمت العملية بنجاح',
    'common.search': 'بحث...',
  },
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.verificationQueue': 'Verification Queue',
    'nav.allWorkshops': 'Workshops Directory',
    'nav.modules': 'Modules & Entitlements',
    'nav.taxonomy': 'Service Taxonomy',
    'nav.brands': 'Brands & Models',
    'nav.logout': 'Logout',

    // Titles & Headers
    'app.title': 'Miftah 360 Admin Dashboard',
    'app.subtitle': 'Governance and platform controls for independent workshops',
    'queue.title': 'Workshop Verification Queue',
    'queue.empty': 'No workshops currently pending verification.',
    'workshops.title': 'Registered Workshops',
    'modules.title': 'Module Entitlements & Marketplace Pack Governance',
    'taxonomy.title': 'Canonical Service Taxonomy V1 (25 Services)',
    'brands.title': 'Vehicle Brands & Models Master Data',

    // Statuses
    'status.PENDING_VERIFICATION': 'Pending Verification',
    'status.ACTIVE': 'Active',
    'status.SUSPENDED': 'Suspended',
    'status.INACTIVE': 'Inactive',
    'status.REJECTED': 'Rejected',

    // Actions
    'action.approve': 'Approve (Activate)',
    'action.reject': 'Reject Application',
    'action.suspend': 'Suspend Workshop',
    'action.reactivate': 'Reactivate',
    'action.deactivate': 'Deactivate',
    'action.enable': 'Enable',
    'action.disable': 'Disable',
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'action.viewDetails': 'View Details',
    'action.addBrand': 'Add New Brand',
    'action.addModel': 'Add Model',
    'action.addService': 'Add Canonical Service',

    // Labels
    'label.reason': 'Reason code (required for audit log)',
    'label.marketplaceParticipation': 'Marketplace Matching Participation',
    'label.verifiedAt': 'Verified At',
    'label.emirate': 'Emirate',
    'label.phone': 'Primary Phone',
    'label.email': 'Primary Email',
    'label.owner': 'Workshop Owner',
    'label.address': 'Physical Address',
    'label.coreModule': 'Workshop Core OS (Always Enabled)',
    'label.marketplaceModule': 'Marketplace Pack',
    'label.inspectionPolicy': 'Inspection Policy',
    'label.preliminaryQuote': 'Preliminary Quote Allowed',

    // Auth & MFA
    'auth.adminLogin': 'Admin Portal Sign-In',
    'auth.mfaRequired': 'Multi-Factor Authentication (MFA) Required',
    'auth.enterMfaCode': 'Enter 6-digit MFA verification code:',
    'auth.verify': 'Verify & Proceed',
    'auth.email': 'Admin Email',
    'auth.password': 'Password',
    'auth.loginBtn': 'Sign In',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'An error occurred while processing the request',
    'common.success': 'Operation completed successfully',
    'common.search': 'Search...',
  },
};

const I18nContext = createContext<I18nContextType>({
  language: 'ar',
  direction: 'rtl',
  setLanguage: () => {},
  t: (key: string) => key,
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('ar');

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const t = (key: string): string => {
    return DICTIONARY[language][key] || key;
  };

  return (
    <I18nContext.Provider
      value={{
        language,
        direction: language === 'ar' ? 'rtl' : 'ltr',
        setLanguage,
        t,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);

