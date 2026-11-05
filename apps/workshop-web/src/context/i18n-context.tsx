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
    'nav.dashboard': 'لوحة التحكم والعمليات',
    'nav.profile': 'الملف التعريفي والموقع',
    'nav.hours': 'أوقات العمل الأسبوعية',
    'nav.brands': 'الماركات المدعومة',
    'nav.services': 'الخدمات والأسعار التقديرية',
    'nav.staff': 'فريق العمل والصلاحيات',
    'nav.customers': 'العملاء والمركبات',
    'nav.logout': 'تسجيل الخروج',

    // App Header
    'app.title': 'نظام إدارة الورشة (Workshop OS)',
    'app.subtitle': 'منصة مفتاح 360 لإدارة عمليات الورش المعتمدة',
    'app.primaryBranch': 'الفرع الرئيسي',

    // Roles
    'role.WORKSHOP_OWNER': 'مالك الورشة',
    'role.SERVICE_ADVISOR': 'مستشار خدمة',
    'role.RECEPTION': 'استقبال',
    'role.TECHNICIAN': 'فني صيانة',

    // Profile Screen
    'profile.title': 'بيانات الورشة والموقع الجغرافي',
    'profile.desc': 'البيانات الرسمية المعتمدة للورشة وعنوانها في إمارة التسجيل.',
    'profile.legalName': 'الاسم التجاري / القانوني (في الرخصة)',
    'profile.displayNameAr': 'اسم الورشة التجاري (بالعربية)',
    'profile.displayNameEn': 'اسم الورشة التجاري (بالإنجليزية)',
    'profile.emirate': 'إمارة الورشة',
    'profile.phone': 'رقم هاتف التواصل',
    'profile.email': 'البريد الإلكتروني للورشة',
    'profile.address': 'العنوان التفصيلي',
    'profile.descAr': 'نبذة عن الورشة (بالعربية)',
    'profile.descEn': 'نبذة عن الورشة (بالإنجليزية)',
    'profile.saveBtn': 'حفظ التعديلات',

    // Hours Screen
    'hours.title': 'جدول وساعات العمل الأسبوعية',
    'hours.desc': 'حدد مواعيد العمل وأيام العطل الرسمية لتنظيم تدفق مواعيد الصيانة.',
    'hours.day': 'اليوم',
    'hours.open': 'يفتح في',
    'hours.close': 'يغلق في',
    'hours.isClosed': 'مغلق (عطلة)',
    'hours.saveBtn': 'حفظ ساعات العمل',

    // Brands Screen
    'brands.title': 'الماركات المصرح بصيانتها',
    'brands.desc': 'حدد ما إذا كانت الورشة تقدم خدماتها لكافة الماركات، أو اختر ماركات محددة للتخصص.',
    'brands.allBrandsToggle': 'خدمة كافة الماركات والشركات (All Brands)',
    'brands.selectedCount': 'الماركات المحددة حالياً:',
    'brands.saveBtn': 'تحديث الماركات المدعومة',

    // Services Screen
    'services.title': 'قائمة الخدمات المركزية والأسعار',
    'services.desc': 'الخدمات مستمدة حصراً من دليل مفتاح 360 المعتمد. يمكنك تحديد الخدمات المفعلة وسعر البداية (يبدأ من بالدرهم الإماراتي).',
    'services.startingPrice': 'السعر المبدئي (د.إ)',
    'services.enabled': 'مفعلة',
    'services.disabled': 'معطلة',
    'services.saveBtn': 'حفظ قائمة الخدمات',

    // Staff Screen
    'staff.title': 'إدارة طاقم عمل الورشة',
    'staff.desc': 'الصلاحيات في المرحلة الأولى محددة ومسبقة الضبط: مالك الورشة، مستشار خدمة، استقبال، فني.',
    'staff.inviteBtn': 'دعوة موظف جديد',
    'staff.name': 'اسم الموظف',
    'staff.role': 'الدور الوظيفي',
    'staff.status': 'الحالة',
    'staff.contact': 'معلومات الاتصال',
    'staff.actions': 'الإجراءات',
    'staff.active': 'نشط',
    'staff.inactive': 'معطل',
    'staff.deactivate': 'تعطيل الحساب',
    'staff.activate': 'تنشيط الحساب',
    'staff.changeRole': 'تغيير الدور',
    'staff.ownerOnlyNotice': 'تنبيه: يحق لمالك الورشة فقط إدارة الموظفين وتعديل أدوارهم.',

    // Customers Screen
    'customers.title': 'سجل العملاء والمركبات',
    'customers.desc': 'عرض العملاء والمركبات المرتبطة بالخدمات الحالية في الورشة.',
    'customers.noData': 'لا توجد مركبات أو عملاء مسجلين حالياً في الورشة.',

    // Common
    'common.loading': 'جاري التحميل...',
    'common.saving': 'جاري الحفظ...',
    'common.success': 'تم الحفظ بنجاح',
    'common.error': 'فشل تنفيذ الإجراء',
    'common.cancel': 'إلغاء',
    'common.confirm': 'تأكيد',
    'common.search': 'بحث...',
  },
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard Overview',
    'nav.profile': 'Profile & Location',
    'nav.hours': 'Working Hours',
    'nav.brands': 'Supported Brands',
    'nav.services': 'Services & Pricing',
    'nav.staff': 'Staff & Roles',
    'nav.customers': 'Customers & Vehicles',
    'nav.logout': 'Sign Out',

    // App Header
    'app.title': 'Workshop OS',
    'app.subtitle': 'Miftah 360 Independent Workshop Operations Platform',
    'app.primaryBranch': 'Primary Location',

    // Roles
    'role.WORKSHOP_OWNER': 'Workshop Owner',
    'role.SERVICE_ADVISOR': 'Service Advisor',
    'role.RECEPTION': 'Reception',
    'role.TECHNICIAN': 'Technician',

    // Profile Screen
    'profile.title': 'Workshop Profile & Location',
    'profile.desc': 'Official registered information and physical operating location in licensed Emirate.',
    'profile.legalName': 'Legal / Trade License Name',
    'profile.displayNameAr': 'Display Name (Arabic)',
    'profile.displayNameEn': 'Display Name (English)',
    'profile.emirate': 'Licensed Emirate',
    'profile.phone': 'Primary Phone',
    'profile.email': 'Primary Email',
    'profile.address': 'Physical Address',
    'profile.descAr': 'Description (Arabic)',
    'profile.descEn': 'Description (English)',
    'profile.saveBtn': 'Save Changes',

    // Hours Screen
    'hours.title': 'Weekly Operating Hours',
    'hours.desc': 'Configure working hours and off days to control service booking slots.',
    'hours.day': 'Day',
    'hours.open': 'Opens At',
    'hours.close': 'Closes At',
    'hours.isClosed': 'Closed (Off)',
    'hours.saveBtn': 'Save Working Hours',

    // Brands Screen
    'brands.title': 'Authorized & Supported Brands',
    'brands.desc': 'Select whether your workshop services All Brands or specialize in specific vehicle makes.',
    'brands.allBrandsToggle': 'We service all vehicle brands (All Brands)',
    'brands.selectedCount': 'Currently selected brands:',
    'brands.saveBtn': 'Update Supported Brands',

    // Services Screen
    'services.title': 'Canonical Services & Starting Prices',
    'services.desc': 'Services are strictly derived from the approved Miftah 360 taxonomy. Set enabled services and "Starting From" price in AED.',
    'services.startingPrice': 'Starting Price (AED)',
    'services.enabled': 'Enabled',
    'services.disabled': 'Disabled',
    'services.saveBtn': 'Save Services',

    // Staff Screen
    'staff.title': 'Workshop Staff & Fixed Roles',
    'staff.desc': 'Phase 1 fixed roles: Workshop Owner, Service Advisor, Reception, and Technician. Custom roles prohibited.',
    'staff.inviteBtn': 'Invite Staff Member',
    'staff.name': 'Staff Name',
    'staff.role': 'Fixed Role',
    'staff.status': 'Status',
    'staff.contact': 'Contact Info',
    'staff.actions': 'Actions',
    'staff.active': 'Active',
    'staff.inactive': 'Disabled',
    'staff.deactivate': 'Disable Account',
    'staff.activate': 'Activate Account',
    'staff.changeRole': 'Change Role',
    'staff.ownerOnlyNotice': 'Notice: Only the Workshop Owner is authorized to invite or manage staff.',

    // Customers Screen
    'customers.title': 'Customer & Vehicle Registry',
    'customers.desc': 'View customers and vehicles associated with current jobs and service records.',
    'customers.noData': 'No customers or vehicles registered with this workshop yet.',

    // Common
    'common.loading': 'Loading...',
    'common.saving': 'Saving...',
    'common.success': 'Saved successfully',
    'common.error': 'Action failed',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
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

