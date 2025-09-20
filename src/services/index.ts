// ---------------------------- Imports ----------------------------

// import: كلمة مفتاحية في TypeScript/JavaScript لاستيراد وحدة أو مكتبة
// dotenv: مكتبة لتحميل المتغيرات البيئية من ملف .env إلى process.env
import dotenv from 'dotenv';

// import: استيراد مكتبة http من Node.js لإنشاء سيرفر HTTP
// http.createServer(): يستخدم لإنشاء سيرفر يمكن ربطه مع Express/Feathers
import http from 'http';

// import: استيراد الدالة initializeApp من ملف app.ts
// تقوم بإنشاء وتكوين تطبيق Feathers مع جميع الخدمات (Services, Routes, Middleware)
import { initializeApp } from '../app';

// import: استيراد دالة تهيئة قاعدة البيانات
// initializeDatabase(): تربط التطبيق بقاعدة البيانات وتعمل migrations/initialization إذا لزم
import { initializeDatabase } from '../app/database';

// import: استيراد دالة تهيئة Cloudinary
// initializeCloudinary(): تقوم بربط التطبيق بحساب Cloudinary للرفع والتخزين السحابي للملفات
import { initializeCloudinary } from '../app/cloudinary';

// import: استيراد دالة setupSocket
// setupSocket(): تربط Socket.IO مع السيرفر لتوفير real-time communication
import { setupSocket } from "../app/socket";

// ---------------------------- تحميل متغيرات البيئة ----------------------------

// dotenv.config(): يقوم بتحميل ملف .env تلقائيًا وإضافة القيم إلى process.env
dotenv.config();

// ---------------------------- الدالة الرئيسية لتشغيل السيرفر ----------------------------

const startServer = async () => {
  // await initializeDatabase(): انتظار تهيئة قاعدة البيانات قبل البدء
  // ضروري لضمان أن جميع الخدمات يمكنها الوصول إلى DB
  await initializeDatabase();

  // initializeCloudinary(): تهيئة حساب Cloudinary
  // لا ينتظر async لأنه غالبًا مجرد إعداد إعدادات SDK
  initializeCloudinary();

  // إنشاء تطبيق Feathers + Express
  const app = await initializeApp();

  // تحديد المنفذ من البيئة أو استخدام 3030 افتراضي
  const port = process.env.PORT || 3030;

  // إنشاء سيرفر HTTP باستخدام Node.js وربطه بتطبيق Feathers
  const server = http.createServer(app);

  // -------------------- Socket.IO --------------------
  // setupSocket(server, app): ربط Socket.IO بالسيرفر الحالي
  // app: تمرير تطبيق Feathers للـ sockets hooks و params
  setupSocket(server, app);

  // -------------------- بدء الاستماع على المنفذ --------------------
  server.listen(port, () => {
    // طباعة رسالة نجاح في تشغيل السيرفر
    console.log(`🚀 Feathers server running on http://localhost:3030 ${port}`);
  });
};

// تشغيل الدالة startServer عند بدء الملف
startServer();

/*
--- ملاحظات عامة ---
1. ترتيب التهيئة مهم:
    - database أولًا (لأن الخدمات تحتاجها)
    - cloudinary ثانيًا (لأن رفع الملفات يعتمد عليها)
    - Feathers app ثالثًا
    - Socket.IO رابعًا (بعد إنشاء server)
2. server.listen(): يفتح المنفذ ويبدأ استقبال الطلبات HTTP و WebSocket
3. Socket.IO:
    - يربط الـ sockets بالـ Feathers app ليسهل التعامل مع events وreal-time updates
4. تحسين الأمان:
    - تأكد أن PORT من البيئة وليس ثابت
    - التعامل مع Cloudinary يجب أن يكون عبر مفاتيح بيئية (process.env)
5. الترقية إلى Feathers 5:
    - لا يوجد تغييرات كبيرة هنا، لكن يمكن استخدام app.listen() مباشرة بدلاً من http.createServer إذا أردت
    - setupSocket يمكن أن يستخدم namespace أو middleware جديد وفق Feathers 5
*/
