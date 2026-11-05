# تطبيق مفتاح 360 للهواتف المحمولة (Flutter Mobile App)

تطبيق ملاك السيارات الرسمي المطور بإطار العمل **Flutter / Dart** لمنظومة مفتاح 360.

---

## 📱 متطلبات التشغيل (Prerequisites)

1. **Flutter SDK**: الإصدار `3.x` أو أحدث. (يمكن تنزيله من [flutter.dev](https://flutter.dev/docs/get-started/install)).
2. **Android Studio** أو **VS Code** مع إضافات Flutter و Dart.
3. تشغيل الـ Backend API المشترك لمنظومة مفتاح 360 على المنفذ `3000`.

---

## 🚀 خطوات التشغيل (Run Instructions)

### 1. تثبيت الحزم والمكتبات:
```bash
cd apps/mobile-flutter
flutter pub get
```

### 2. تشغيل التطبيق في وضع التطوير:

- **على متصفح Chrome (Web Preview مباشر)**:
```bash
flutter run -d chrome
```

- **على محاكي Android (Android Emulator)**:
  *يتصل تلقائياً بالـ API عبر العنوان `http://10.0.2.2:3000/api/v1`*
```bash
flutter run
```

- **على محاكي iOS (iPhone Simulator)**:
```bash
flutter run -d iphone
```

### 3. بناء نسخة الإنتاج (Production Build):
- **بناء ملف APK لأجهزة أندرويد**:
```bash
flutter build apk --release
```
- **بناء حزمة Android App Bundle (AAB) لمتجر Google Play**:
```bash
flutter build appbundle --release
```

---

## 🔑 حساب التجربة السريع (Demo Car Owner)
- **البريد الإلكتروني**: `user@carowner.local`
- **كلمة المرور**: `ReviewPass123!`
- **الاسم**: منصور المنصوري (يحتوي على 3 مركبات مسجلة بلوحات دبي وأبوظبي)
- أو عبر رقم الهاتف الإماراتي: `+971501112233` وكود التحقق `123456`.

