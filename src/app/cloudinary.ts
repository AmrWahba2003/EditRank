// ---------------------------- Imports ----------------------------

// استيراد مكتبة Cloudinary SDK (الإصدار 2)
// v2: أحدث واجهة API من Cloudinary
// alias باسم "cloudinary" لتسهيل الاستخدام
import { v2 as cloudinary } from 'cloudinary';

// ---------------------------- initializeCloudinary ----------------------------

export const initializeCloudinary = () => {
    // -------------------- تهيئة Cloudinary --------------------
    // config: لتعيين بيانات الحساب وإعداداته
        cloudinary.config({
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // اسم السحابة في Cloudinary
                api_key: process.env.CLOUDINARY_API_KEY,       // مفتاح API
                api_secret: process.env.CLOUDINARY_API_SECRET, // السر الخاص بـ API (يجب عدم كشفه)
        });

    // -------------------- رسالة تأكيد --------------------
    // لتأكيد أن التهيئة تمت بنجاح
        console.log('✅ Cloudinary configured');
};

// ---------------------------- ملاحظات أمان وأداء ----------------------------

/*
1. استخدام environment variables:
        - يمنع كشف معلومات حساسة في الكود المصدر.
        - يجب تخزين CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET في .env أو secret manager.

2. cloudinary.config:
        - يسمح بالاتصال بالسحابة وإرسال واستقبال الوسائط (صور وفيديوهات).
        - يمكن إضافة خيارات إضافية مثل secure: true لضمان استخدام HTTPS.

3. الأداء:
        - هذه التهيئة يجب أن تتم مرة واحدة عند بدء التطبيق.
        - بعد التهيئة يمكن استخدام cloudinary.uploader.upload() لأي رفع ملفات.

4. تحسينات مقترحة:
        - التعامل مع أخطاء الاتصال بالسحابة أثناء التهيئة.
        - دعم التهيئة متعددة البيئات (development/production).
        - يمكن تسجيل الأحداث أو استخدام logging لمراقبة أي فشل بالرفع أو الحذف.

5. عند الترقية أو استخدام Feathers 5:
        - نفس الكود يعمل تمامًا.
        - يمكن تمرير cloudinary object لأي Service يحتاج رفع أو حذف ملفات.
*/
