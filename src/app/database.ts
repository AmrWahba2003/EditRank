// ---------------------------- Imports ----------------------------

// استيراد mongoose للتعامل مع MongoDB
import mongoose from 'mongoose';

// ---------------------------- initializeDatabase ----------------------------
export const initializeDatabase = async () => {
    try {
        // -------------------- جلب URI من environment variables --------------------
        const mongoUri = process.env.MONGO_URI;

        // التحقق من أن URI موجود
        if (!mongoUri) 
            throw new Error('MongoDB URI is not defined in environment variables');

        // -------------------- الاتصال بـ MongoDB --------------------
        // mongoose.connect(uri): فتح اتصال مع قاعدة البيانات
        await mongoose.connect(mongoUri);

        // تسجيل نجاح الاتصال
        console.log('✅ Connected to MongoDB Atlas');

    } catch (error) {
        // تسجيل أي خطأ في الاتصال
        console.error('❌ MongoDB connection error:', error);

        // إنهاء العملية في حالة فشل الاتصال
        process.exit(1);
    }
};

// ---------------------------- ملاحظات أمان وأداء ----------------------------

/*
1. mongoUri:
    - يجب تخزين URI في environment variable وليس في الكود لتجنب كشف بيانات الاتصال.
    - URI عادة يحتوي على اسم المستخدم وكلمة المرور واسم قاعدة البيانات.

2. mongoose.connect:
    - يدعم خيارات إضافية مثل useNewUrlParser, useUnifiedTopology لتحسين التوافق مع MongoDB Atlas.
    - يفتح اتصال persistent يمكن استخدامه طوال عمر التطبيق.

3. try/catch:
    - يمنع انهيار التطبيق بشكل غير منظم.
    - في حالة فشل الاتصال، يتم إيقاف التطبيق (process.exit(1)) لتجنب تشغيله بدون DB.

4. تحسينات مقترحة:
    - إعادة محاولة الاتصال تلقائيًا عند الفشل.
    - تسجيل أخطاء الاتصال في ملفات logs أو Monitoring system.
    - استخدام Mongoose connection events (`connected`, `disconnected`, `error`) لمراقبة حالة DB.

5. عند الترقية إلى Feathers 5:
    - نفس الكود يمكن استخدامه مباشرة.
    - يمكن دمج connection مع hooks أو services عند الحاجة لاستخدام DB قبل أي operation.
*/
