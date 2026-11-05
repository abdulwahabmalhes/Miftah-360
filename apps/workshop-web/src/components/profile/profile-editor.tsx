import React, { useState, useEffect } from 'react';
import { useI18n } from '../../context/i18n-context';
import { workshopApi } from '../../api/workshop-client';
import { HoursEditor } from '../hours/hours-editor';
import { BrandsSelector } from '../brands/brands-selector';
import { ServicesCatalog } from '../services/services-catalog';

export type ProfileTab = 'info' | 'photos' | 'services' | 'brands' | 'hours' | 'modules';

interface GalleryPhoto {
  id: string;
  url: string;
  captionAr: string;
  category: 'EXTERIOR' | 'BAY' | 'LOUNGE' | 'DIAGNOSTICS';
}

const DEFAULT_PHOTOS: GalleryPhoto[] = [
  {
    id: 'p1',
    url: 'https://images.unsplash.com/photo-1613214149922-f1809c99b414?auto=format&fit=crop&w=800&q=80',
    captionAr: 'واجهة الورشة الخارجية ومواقف الاستقبال',
    category: 'EXTERIOR',
  },
  {
    id: 'p2',
    url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80',
    captionAr: 'حارات الصيانة الميكانيكية ورافعات الهيدروليك',
    category: 'BAY',
  },
  {
    id: 'p3',
    url: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80',
    captionAr: 'قسم فحص وبرمجة كمبيوتر السيارات',
    category: 'DIAGNOSTICS',
  },
  {
    id: 'p4',
    url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
    captionAr: 'صالة استراحة وانتظار العملاء المكيفة',
    category: 'LOUNGE',
  },
];

interface ProfileEditorProps {
  initialTab?: ProfileTab;
}

export const ProfileEditor: React.FC<ProfileEditorProps> = ({ initialTab = 'info' }) => {
  const { t, language } = useI18n();
  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile General Info & Story Form
  const [formData, setFormData] = useState({
    legalName: '',
    displayNameEn: '',
    displayNameAr: '',
    primaryPhone: '',
    whatsappPhone: '+971 50 123 4567',
    primaryEmail: '',
    addressText: '',
    latitude: 25.1384,
    longitude: 55.2341,
    descriptionEn: '',
    descriptionAr: '',
    yearsInBusiness: 12,
    tradeLicenseNo: 'CN-1092837',
    trnNumber: '100293847500003',
  });

  // Photos State
  const [logoUrl, setLogoUrl] = useState<string>(
    'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=200&q=80',
  );
  const [coverUrl, setCoverUrl] = useState<string>(
    'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=1200&q=80',
  );
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryPhoto[]>(DEFAULT_PHOTOS);
  const [showAddPhotoModal, setShowAddPhotoModal] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoCaption, setNewPhotoCaption] = useState('');
  const [newPhotoCategory, setNewPhotoCategory] = useState<'EXTERIOR' | 'BAY' | 'LOUNGE' | 'DIAGNOSTICS'>('BAY');

  const loadProfile = async () => {
    try {
      setLoading(true);
      setMessage(null);
      const data = await workshopApi.getProfile();
      setProfile(data);

      // Load saved photos from local storage if existing
      const savedPhotos = localStorage.getItem(`miftah_photos_${data.id}`);
      if (savedPhotos) {
        try {
          const parsed = JSON.parse(savedPhotos);
          if (parsed.logo) setLogoUrl(parsed.logo);
          if (parsed.cover) setCoverUrl(parsed.cover);
          if (parsed.gallery) setGalleryPhotos(parsed.gallery);
        } catch {}
      }

      setFormData({
        legalName: data.legalName || 'Miftah Al Emarat Garage LLC',
        displayNameEn: data.displayNameEn || 'Miftah Al Emarat Auto Care',
        displayNameAr: data.displayNameAr || 'كراج مفتاح الإمارات لصيانة السيارات',
        primaryPhone: data.primaryPhone || '+971 4 333 4455',
        whatsappPhone: '+971 50 123 4567',
        primaryEmail: data.primaryEmail || 'owner@workshop.local',
        addressText: data.addressText || 'Al Quoz Industrial Area 3, Street 18, Dubai',
        latitude: Number(data.latitude) || 25.1384,
        longitude: Number(data.longitude) || 55.2341,
        descriptionEn:
          data.descriptionEn ||
          'Premier automotive repair center founded in 2014, specializing in German, European, and Japanese vehicles with state-of-the-art diagnostic equipment and guaranteed OEM spare parts.',
        descriptionAr:
          data.descriptionAr ||
          'مركز صيانة سيارات متكامل معتمد تأسس عام 2014 في منطقة القوز بدبي، متخصص في صيانة السيارات الألمانية والأوروبية واليابانية، ونمتلك أحدث أجهزة الفحص المعتمدة من الوكالات ورافعات الصيانة مع ضمان معتمد على كافة أعمال الصيانة وقطع الغيار الأصلية.',
        yearsInBusiness: 12,
        tradeLicenseNo: 'CN-1092837',
        trnNumber: '100293847500003',
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || t('common.error') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleSaveGeneralInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);
      await workshopApi.updateProfile({
        legalName: formData.legalName,
        displayNameEn: formData.displayNameEn,
        displayNameAr: formData.displayNameAr,
        primaryPhone: formData.primaryPhone,
        primaryEmail: formData.primaryEmail,
        addressText: formData.addressText,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        descriptionEn: formData.descriptionEn,
        descriptionAr: formData.descriptionAr,
      });

      // Save photos alongside
      if (profile?.id) {
        localStorage.setItem(
          `miftah_photos_${profile.id}`,
          JSON.stringify({
            logo: logoUrl,
            cover: coverUrl,
            gallery: galleryPhotos,
          }),
        );
      }

      setMessage({ type: 'success', text: 'تم حفظ وتحديث ملف الورشة بنجاح!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || t('common.error') });
    } finally {
      setSaving(false);
    }
  };

  const handleAddPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhotoUrl || !newPhotoCaption) return;
    const newP: GalleryPhoto = {
      id: `p-${Date.now()}`,
      url: newPhotoUrl,
      captionAr: newPhotoCaption,
      category: newPhotoCategory,
    };
    const updated = [newP, ...galleryPhotos];
    setGalleryPhotos(updated);
    if (profile?.id) {
      localStorage.setItem(
        `miftah_photos_${profile.id}`,
        JSON.stringify({
          logo: logoUrl,
          cover: coverUrl,
          gallery: updated,
        }),
      );
    }
    setShowAddPhotoModal(false);
    setNewPhotoUrl('');
    setNewPhotoCaption('');
    setMessage({ type: 'success', text: 'تمت إضافة الصورة إلى معرض الورشة بنجاح!' });
  };

  const handleRemovePhoto = (id: string) => {
    const updated = galleryPhotos.filter((p) => p.id !== id);
    setGalleryPhotos(updated);
    if (profile?.id) {
      localStorage.setItem(
        `miftah_photos_${profile.id}`,
        JSON.stringify({
          logo: logoUrl,
          cover: coverUrl,
          gallery: updated,
        }),
      );
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center shadow-sm">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mb-3"></div>
        <p className="text-xs text-slate-500 font-bold">جاري تحميل ملف الورشة الشامل...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Top Banner & Header Showcase */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Cover Image Banner */}
        <div className="relative h-44 sm:h-52 bg-slate-800 overflow-hidden">
          <img src={coverUrl} alt="Workshop Cover" className="w-full h-full object-cover opacity-85" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent"></div>

          {/* Change Cover CTA Button */}
          <button
            onClick={() => {
              const url = prompt('أدخل رابط الصورة الجديدة لغلاف الورشة:', coverUrl);
              if (url) {
                setCoverUrl(url);
                setMessage({ type: 'success', text: 'تم تحديث صورة غلاف الورشة!' });
              }
            }}
            className="absolute top-4 left-4 px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white rounded-xl text-xs font-bold backdrop-blur-sm transition border border-white/20 flex items-center gap-1.5"
          >
            <span>📷</span>
            <span>تغيير صورة الغلاف</span>
          </button>

          {/* Profile Identity Overlay */}
          <div className="absolute bottom-4 right-6 flex items-end gap-4 text-white">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white p-1 shadow-2xl border-2 border-white overflow-hidden shrink-0">
              <img src={logoUrl} alt="Logo" className="w-full h-full object-cover rounded-xl" />
              <button
                onClick={() => {
                  const url = prompt('أدخل رابط شعار / أيقونة الورشة:', logoUrl);
                  if (url) {
                    setLogoUrl(url);
                    setMessage({ type: 'success', text: 'تم تحديث شعار الورشة!' });
                  }
                }}
                className="absolute inset-0 bg-black/40 hover:bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition rounded-xl"
              >
                تغيير الشعار
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950 shadow-sm">
                  {profile?.status === 'ACTIVE' ? '✅ ورشة معتمدة رسمياً' : profile?.status || 'قيد التدقيق'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white backdrop-blur-sm">
                  {profile?.emirate === 'DUBAI' ? 'دبي' : 'الشارقة'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight drop-shadow-md">
                {formData.displayNameAr || formData.legalName}
              </h1>
              <p className="text-xs text-slate-300 font-medium drop-shadow">{formData.displayNameEn}</p>
            </div>
          </div>
        </div>

        {/* Unified Tab Bar */}
        <div className="px-4 border-b border-slate-100 flex overflow-x-auto gap-1 bg-slate-50/70 pt-2">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-3 text-xs font-bold rounded-t-xl transition whitespace-nowrap flex items-center gap-2 border-b-2 ${
              activeTab === 'info'
                ? 'bg-white text-emerald-800 border-emerald-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <span>🏢</span>
            <span>البيانات والقصة والموقع</span>
          </button>

          <button
            onClick={() => setActiveTab('photos')}
            className={`px-4 py-3 text-xs font-bold rounded-t-xl transition whitespace-nowrap flex items-center gap-2 border-b-2 ${
              activeTab === 'photos'
                ? 'bg-white text-emerald-800 border-emerald-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <span>📸</span>
            <span>معرض الصور والواجهة ({galleryPhotos.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('services')}
            className={`px-4 py-3 text-xs font-bold rounded-t-xl transition whitespace-nowrap flex items-center gap-2 border-b-2 ${
              activeTab === 'services'
                ? 'bg-white text-emerald-800 border-emerald-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <span>🛠️</span>
            <span>الخدمات والأسعار التقديرية</span>
          </button>

          <button
            onClick={() => setActiveTab('brands')}
            className={`px-4 py-3 text-xs font-bold rounded-t-xl transition whitespace-nowrap flex items-center gap-2 border-b-2 ${
              activeTab === 'brands'
                ? 'bg-white text-emerald-800 border-emerald-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <span>🚗</span>
            <span>الماركات المدعومة</span>
          </button>

          <button
            onClick={() => setActiveTab('hours')}
            className={`px-4 py-3 text-xs font-bold rounded-t-xl transition whitespace-nowrap flex items-center gap-2 border-b-2 ${
              activeTab === 'hours'
                ? 'bg-white text-emerald-800 border-emerald-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <span>⏰</span>
            <span>ساعات وأوقات العمل</span>
          </button>

          <button
            onClick={() => setActiveTab('modules')}
            className={`px-4 py-3 text-xs font-bold rounded-t-xl transition whitespace-nowrap flex items-center gap-2 border-b-2 ${
              activeTab === 'modules'
                ? 'bg-white text-emerald-800 border-emerald-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 border-transparent'
            }`}
          >
            <span>✨</span>
            <span>الباقات والموديولات المفعلة</span>
          </button>
        </div>
      </div>

      {/* Global Feedback Alert */}
      {message && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-red-50 text-red-900 border border-red-200'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600 font-black">
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: GENERAL INFO, STORY & LOCATION */}
      {activeTab === 'info' && (
        <form onSubmit={handleSaveGeneralInfo} className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
              <span>🏢</span>
              <span>البيانات التجارية والقانونية</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم الورشة التجاري (بالعربية) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.displayNameAr}
                  onChange={(e) => setFormData({ ...formData, displayNameAr: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم الورشة التجاري (بالإنجليزية) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.displayNameEn}
                  onChange={(e) => setFormData({ ...formData, displayNameEn: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الاسم القانوني في الرخصة التجارية *</label>
                <input
                  type="text"
                  required
                  value={formData.legalName}
                  onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم الرخصة التجارية (Trade License)</label>
                <input
                  type="text"
                  value={formData.tradeLicenseNo}
                  onChange={(e) => setFormData({ ...formData, tradeLicenseNo: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-mono bg-slate-50"
                />
              </div>
            </div>

            {/* Workshop Story & Bio */}
            <div className="pt-2 border-t border-slate-100 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>قصة ونبذة عن الورشة (بالعربية) *</span>
                  <span className="text-[10px] text-slate-400">تظهر في بروفايل الورشة للعملاء على التطبيق</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.descriptionAr}
                  onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                  placeholder="اكتب نبذة عن تاريخ المنشأة وخبرات الفنيين والتخصصات..."
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Workshop Story & About Us (English)
                </label>
                <textarea
                  rows={2}
                  value={formData.descriptionEn}
                  onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                  placeholder="Describe your garage experience, certified mechanics, and equipment..."
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs leading-relaxed"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 mb-3">بيانات الاتصال والتواصل المباشر</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم هاتف الورشة الرسمي *</label>
                  <input
                    type="text"
                    required
                    value={formData.primaryPhone}
                    onChange={(e) => setFormData({ ...formData, primaryPhone: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-mono text-left"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الواتساب للتواصل الفوري</label>
                  <input
                    type="text"
                    value={formData.whatsappPhone}
                    onChange={(e) => setFormData({ ...formData, whatsappPhone: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-mono text-left"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني للورشة *</label>
                  <input
                    type="email"
                    required
                    value={formData.primaryEmail}
                    onChange={(e) => setFormData({ ...formData, primaryEmail: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs text-left"
                  />
                </div>
              </div>
            </div>

            {/* Location & GPS */}
            <div className="pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 mb-3">الموقع الجغرافي والعنوان</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">العنوان التفصيلي (الشارع والمنطقة) *</label>
                  <input
                    type="text"
                    required
                    value={formData.addressText}
                    onChange={(e) => setFormData({ ...formData, addressText: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">خط العرض (Latitude)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">خط الطول (Longitude)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50 flex items-center gap-2"
              >
                <span>💾</span>
                <span>{saving ? 'جاري الحفظ...' : 'حفظ تعديلات الملف والقصة'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: PHOTOS & WORKSHOP GALLERY */}
      {activeTab === 'photos' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>📸</span>
                  <span>معرض صور المنشأة ومرافق الصيانة</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  أضف صور عالية الجودة لحارات العمل، صالة الاستقبال، وأجهزة الفحص لزيادة ثقة العملاء ومعدل قبول العروض.
                </p>
              </div>

              <button
                onClick={() => setShowAddPhotoModal(true)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition shrink-0 flex items-center gap-1.5"
              >
                <span>＋</span>
                <span>إضافة صورة جديدة للمعرض</span>
              </button>
            </div>

            {/* Photos Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {galleryPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 flex flex-col"
                >
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={photo.url}
                      alt={photo.captionAr}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <span className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 text-white text-[10px] font-bold rounded-lg backdrop-blur-sm">
                      {photo.category === 'EXTERIOR'
                        ? 'الواجهة'
                        : photo.category === 'BAY'
                        ? 'حارات العمل'
                        : photo.category === 'DIAGNOSTICS'
                        ? 'أجهزة الفحص'
                        : 'صالة الاستقبال'}
                    </span>
                  </div>

                  <div className="p-3 bg-white flex-1 flex flex-col justify-between">
                    <p className="text-xs font-bold text-slate-900 line-clamp-2 leading-relaxed">{photo.captionAr}</p>
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => handleRemovePhoto(photo.id)}
                        className="text-[11px] text-red-600 hover:text-red-800 font-bold flex items-center gap-1"
                      >
                        <span>🗑️</span>
                        <span>حذف</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SERVICES & STARTING PRICES (EMBEDDED) */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-950 font-medium">
            💡 يمكنك تفعيل الخدمات التي تقدمها ورشتك وتحديد السعر المبدئي الاسترشادي (Starting From AED) مباشرة من هذا الجدول.
          </div>
          <ServicesCatalog />
        </div>
      )}

      {/* TAB 4: SUPPORTED BRANDS (EMBEDDED) */}
      {activeTab === 'brands' && (
        <div className="space-y-4">
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs text-indigo-950 font-medium">
            🚗 حدد ماركات السيارات التي تستقبلها ورشتك وتوفر لها فنيين متخصصين وقطع غيار معتمدة.
          </div>
          <BrandsSelector />
        </div>
      )}

      {/* TAB 5: WORKING HOURS (EMBEDDED) */}
      {activeTab === 'hours' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 font-medium">
            ⏰ اضبط مواعيد وأيام عمل الورشة الأسبوعية ليعرف العملاء ومحرك المطابقة جاهزيتك لاستقبال المركبات.
          </div>
          <HoursEditor />
        </div>
      )}

      {/* TAB 6: ACTIVE PLATFORM MODULES */}
      {activeTab === 'modules' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>✨</span>
                <span>الباقات والموديولات المفعلة للورشة</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                تمنح وتدار هذه الصلاحيات مركزياً من إدارة منصة مفتاح 360 وفق عقد الورشة.
              </p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-lg">
              11 موديول مفعل
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { code: 'CORE', nameAr: 'نظام تشغيل الورشة الأساسي (Core OS)', icon: '🏢' },
              { code: 'MARKETPLACE_PACK', nameAr: 'حزمة سوق مفتاح والمطابقة', icon: '🛒' },
              { code: 'INVENTORY', nameAr: 'إدارة المخزون وقطع الغيار', icon: '📦' },
              { code: 'WARRANTY', nameAr: 'الضمانات وشهادات الصيانة الرقمية', icon: '🛡️' },
              { code: 'SUPPLIERS', nameAr: 'الموردين وفواتير الشراء', icon: '🤝' },
              { code: 'POS', nameAr: 'نقطة البيع والدفع السريع', icon: '💳' },
              { code: 'ADVANCED_CRM', nameAr: 'علاقات العملاء والولاء', icon: '❤️' },
              { code: 'TASKS', nameAr: 'المهام وجدولة الفنيين', icon: '⏱️' },
              { code: 'CONTRACTS', nameAr: 'عقود صيانة الشركات والأساطيل', icon: '📑' },
              { code: 'HR', nameAr: 'شؤون الموظفين والورديات', icon: '👥' },
              { code: 'ADVANCED_REPORTS', nameAr: 'التقارير التحليلية والمالية', icon: '📊' },
            ].map((m) => (
              <div key={m.code} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{m.icon}</span>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{m.nameAr}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{m.code}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                  مفعل ✅
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Photo Modal */}
      {showAddPhotoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm">إضافة صورة جديدة لمعرض الورشة</h3>
              <button onClick={() => setShowAddPhotoModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddPhoto} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رابط الصورة (Image URL) *</label>
                <input
                  type="url"
                  required
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 border rounded-xl text-xs font-mono text-left"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">عنوان / وصف الصورة بالعربية *</label>
                <input
                  type="text"
                  required
                  value={newPhotoCaption}
                  onChange={(e) => setNewPhotoCaption(e.target.value)}
                  placeholder="مثال: حارة وزن الأذرعة والميزان ثلاثي الأبعاد"
                  className="w-full px-3 py-2 border rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">تصنيف الصورة</label>
                <select
                  value={newPhotoCategory}
                  onChange={(e: any) => setNewPhotoCategory(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                >
                  <option value="BAY">حارات ومصاعد الصيانة (BAY)</option>
                  <option value="DIAGNOSTICS">أجهزة التشخيص والكمبيوتر (DIAGNOSTICS)</option>
                  <option value="LOUNGE">صالة استراحة العملاء (LOUNGE)</option>
                  <option value="EXTERIOR">الواجهة والمواقف (EXTERIOR)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPhotoModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow"
                >
                  إضافة للمعرض
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
