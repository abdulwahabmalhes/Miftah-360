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
    // App Bar & Nav
    'app.name': 'مفتاح 360',
    'nav.garage': 'كراجي',
    'nav.requests': 'طلبات الصيانة',
    'nav.profile': 'حسابي',

    // Auth
    'auth.welcome': 'أهلاً بك في مفتاح 360',
    'auth.welcomeSubtitle': 'تطبيقك الشامل للعناية بمركبتك وصيانتها في الإمارات',
    'auth.loginTab': 'تسجيل الدخول',
    'auth.registerTab': 'حساب جديد',
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.fullName': 'الاسم الكامل',
    'auth.phone': 'رقم الهاتف المتحرك',
    'auth.or': 'أو المتابعة عبر',
    'auth.phoneOtpBtn': 'الدخول برقم الهاتف ورمز OTP',
    'auth.googleBtn': 'المتابعة باستخدام Google',
    'auth.sendOtp': 'إرسال رمز التحقق (SMS)',
    'auth.enterOtp': 'أدخل رمز التحقق المكون من 6 أرقام:',
    'auth.verifyOtp': 'تأكيد الرمز والدخول',
    'auth.back': 'رجوع',
    'auth.linkPrompt': 'هل تود ربط حساب Google أو رقم الهاتف؟',
    'auth.linkSuccess': 'تم ربط الحساب بنجاح',

    // Garage
    'garage.title': 'كراج المركبات',
    'garage.activeTab': 'المركبات النشطة',
    'garage.archivedTab': 'الأرشيف',
    'garage.addVehicle': '+ إضافة مركبة جديدة',
    'garage.emptyActive': 'كراجك فارغ حالياً! أضف مركبتك الأولى للبدء في طلبات الصيانة والعروض.',
    'garage.emptyArchived': 'لا توجد مركبات في الأرشيف.',
    'garage.mileage': 'المسافة المقطوعة:',
    'garage.plate': 'رقم اللوحة:',
    'garage.viewDetails': 'تفاصيل وسجل المركبة',

    // Add / Edit Vehicle
    'vehicle.addTitle': 'إضافة مركبة إلى الكراج',
    'vehicle.editTitle': 'تعديل بيانات المركبة',
    'vehicle.requiredSection': 'البيانات الأساسية (إلزامية)',
    'vehicle.optionalSection': 'البيانات الإضافية والمستندات (اختيارية)',
    'vehicle.brand': 'العلامة التجارية (الشركة المصنعة)',
    'vehicle.model': 'موديل السيارة',
    'vehicle.year': 'سنة الصنع',
    'vehicle.mileage': 'العداد الحالي (كم)',
    'vehicle.trim': 'الفئة / الطراز (Trim)',
    'vehicle.fuelType': 'نوع الوقود',
    'vehicle.transmission': 'ناقل الحركة',
    'vehicle.vin': 'رقم الهيكل / الشاسيه (VIN)',
    'vehicle.plateNumber': 'رقم اللوحة',
    'vehicle.plateEmirate': 'إمارة اللوحة',
    'vehicle.registrationExpiry': 'تاريخ انتهاء الملكية',
    'vehicle.insuranceExpiry': 'تاريخ انتهاء التأمين',
    'vehicle.notes': 'ملاحظات إضافية عن المركبة',
    'vehicle.save': 'حفظ المركبة في الكراج',
    'vehicle.selectBrand': 'اختر العلامة التجارية',
    'vehicle.selectModel': 'اختر الموديل',

    // Vehicle Profile
    'vehicle.profileTitle': 'ملف المركبة',
    'vehicle.specs': 'المواصفات الفنية',
    'vehicle.maintenanceHistory': 'سجل الصيانة والفواتير',
    'vehicle.noHistory': 'لا توجد سجلات صيانة سابقة لهذه المركبة حتى الآن.',
    'vehicle.historyNotice': 'سيتم تسجيل الفواتير وأوامر الشغل تلقائياً فور إتمام الصيانة لدى الورش المعتمدة.',
    'vehicle.archiveBtn': 'أرشفة المركبة',
    'vehicle.unarchiveBtn': 'استعادة المركبة إلى الكراج',
    'vehicle.archiveConfirm': 'هل أنت متأكد من رغبتك في نقل هذه المركبة إلى الأرشيف؟',

    // Common
    'common.loading': 'جاري التحميل...',
    'common.saving': 'جاري الحفظ...',
    'common.success': 'تمت العملية بنجاح',
    'common.error': 'حدث خطأ، يرجى المحاولة مرة أخرى',
    'common.cancel': 'إلغاء',
    'common.confirm': 'تأكيد',
    'common.logout': 'تسجيل الخروج',
  },
  en: {
    // App Bar & Nav
    'app.name': 'Miftah 360',
    'nav.garage': 'Garage',
    'nav.requests': 'Service Requests',
    'nav.profile': 'Profile',

    // Auth
    'auth.welcome': 'Welcome to Miftah 360',
    'auth.welcomeSubtitle': 'Your unified automotive companion across the UAE',
    'auth.loginTab': 'Sign In',
    'auth.registerTab': 'Register',
    'auth.email': 'Email Address',
    'auth.password': 'Password',
    'auth.fullName': 'Full Name',
    'auth.phone': 'Mobile Phone Number',
    'auth.or': 'Or continue with',
    'auth.phoneOtpBtn': 'Sign In with Phone & OTP',
    'auth.googleBtn': 'Continue with Google',
    'auth.sendOtp': 'Send OTP via SMS',
    'auth.enterOtp': 'Enter the 6-digit verification code:',
    'auth.verifyOtp': 'Verify Code & Sign In',
    'auth.back': 'Back',
    'auth.linkPrompt': 'Link Google account or phone number to your profile?',
    'auth.linkSuccess': 'Account linked successfully',

    // Garage
    'garage.title': 'My Garage',
    'garage.activeTab': 'Active Vehicles',
    'garage.archivedTab': 'Archived',
    'garage.addVehicle': '+ Add New Vehicle',
    'garage.emptyActive': 'Your garage is currently empty. Add your first vehicle to request maintenance and quotes.',
    'garage.emptyArchived': 'No archived vehicles.',
    'garage.mileage': 'Current Mileage:',
    'garage.plate': 'Plate:',
    'garage.viewDetails': 'Details & History',

    // Add / Edit Vehicle
    'vehicle.addTitle': 'Add Vehicle to Garage',
    'vehicle.editTitle': 'Edit Vehicle Details',
    'vehicle.requiredSection': 'Required Vehicle Information',
    'vehicle.optionalSection': 'Optional Specifications & Registration',
    'vehicle.brand': 'Make / Brand',
    'vehicle.model': 'Model',
    'vehicle.year': 'Manufacturing Year',
    'vehicle.mileage': 'Current Mileage (km)',
    'vehicle.trim': 'Trim / Edition',
    'vehicle.fuelType': 'Fuel Type',
    'vehicle.transmission': 'Transmission',
    'vehicle.vin': 'VIN / Chassis Number',
    'vehicle.plateNumber': 'Plate Number',
    'vehicle.plateEmirate': 'Plate Emirate',
    'vehicle.registrationExpiry': 'Registration (Mulkiya) Expiry',
    'vehicle.insuranceExpiry': 'Insurance Expiry',
    'vehicle.notes': 'Additional Notes',
    'vehicle.save': 'Save Vehicle to Garage',
    'vehicle.selectBrand': 'Select Brand',
    'vehicle.selectModel': 'Select Model',

    // Vehicle Profile
    'vehicle.profileTitle': 'Vehicle Profile',
    'vehicle.specs': 'Technical Specifications',
    'vehicle.maintenanceHistory': 'Maintenance & Invoice History',
    'vehicle.noHistory': 'No previous maintenance history recorded for this vehicle yet.',
    'vehicle.historyNotice': 'Service orders and approved invoices will appear here automatically upon completion at certified workshops.',
    'vehicle.archiveBtn': 'Archive Vehicle',
    'vehicle.unarchiveBtn': 'Restore to Active Garage',
    'vehicle.archiveConfirm': 'Are you sure you want to move this vehicle to your archive?',

    // Common
    'common.loading': 'Loading...',
    'common.saving': 'Saving...',
    'common.success': 'Operation completed successfully',
    'common.error': 'An error occurred, please try again',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.logout': 'Sign Out',
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
  };

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

