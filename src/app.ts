// ---------------------------- Imports ----------------------------

// import: كلمة مفتاحية في TypeScript/JavaScript لاستيراد وحدة (module) أو مكتبة
// feathers: اسم المكتبة المستوردة، مكتبة FeathersJS الأساسية لإنشاء تطبيقات real-time وREST
// '@feathersjs/feathers': مسار الحزمة (package) في node_modules
import feathers from '@feathersjs/feathers';

// import: استيراد Feathers-Express
// express: كائن سيتم استخدامه لدمج Feathers مع Express
// '@feathersjs/express': حزمة لدمج Feathers مع Express، تمكنك من التعامل مع REST routes + middleware
// الفرق: Express وحده لا يدعم مفهوم Service أو real-time sockets
import express from '@feathersjs/express';

// import: استيراد body-parser
// body-parser: مكتبة لتحليل بيانات body في HTTP request
// يمكنها تحليل JSON و URL-encoded form
// ملاحظة: Express >= 4.16 يمكنه استخدام express.json() و express.urlencoded() بدل body-parser
import bodyParser from 'body-parser';

// import: استيراد مكتبة path
// path: مكتبة Node.js للعمل مع مسارات الملفات على النظام
// تستخدم لتحديد موقع ملفات ثابتة مثل index.html أو مجلد public
import path from 'path';

// import: استيراد مكتبة jsonwebtoken
// jwt: مكتبة لإنشاء والتحقق من JSON Web Tokens
// تستخدم للتحقق من هوية المستخدم في REST endpoints وFeathers services
import jwt from 'jsonwebtoken';

// import: استيراد إعدادات Google OAuth + JWT الخاصة بالمشروع
// setupAuth: دالة تضبط Google OAuth وتهيئة JWT
import { setupAuth } from './app/google.auth';

// import: استيراد hook للتحقق من JWT على مستوى Feathers services
// verifyJWT: دالة تستخدم داخل hooks على الـ services لحماية CRUD operations
import { verifyJWT } from './app/jwt.middleware';

// import: استيراد الخدمات (Services) الخاصة بالمشروع
// كل Service مسؤول عن نوع بيانات معين (Users, Videos, Categories, Messages)
import { VideoService } from './services/videos/video.service';
import { UserServices } from './services/users/user.service';
import { CategoryService } from "./services/categories/category.service";
import { MessageService } from './services/messages/message.service';

// import: استيراد multer لإدارة رفع الملفات
// multer: مكتبة لإنشاء Middleware للتعامل مع multipart/form-data (رفع الملفات)
import multer from 'multer';

// upload: متغير يقوم بتخزين إعدادات multer
// dest: المجلد الذي سيتم حفظ الملفات فيه عند رفعها
const upload = multer({ dest: 'uploads/' });

// import: استيراد Types من Express
// Request: يمثل الطلب القادم من العميل
// Response: يمثل الرد المرسل للعميل
// NextFunction: يمثل الدالة التالية في سلسلة الـ middleware
import { Request, Response, NextFunction } from 'express';

// import: استيراد HookContext من Feathers
// يمثل سياق الـ service (params, data, id, result) داخل الـ hooks
import { HookContext } from '@feathersjs/feathers';

// ---------------------------- Middleware للتحقق من JWT ----------------------------

// const: لإنشاء ثابت
// verifyJWTMiddleware: اسم الدالة التي ستعمل كـ middleware على REST routes
// (req, res, next): دوال Express الأساسية للـ middleware
const verifyJWTMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // قراءة Authorization header من الطلب
    const authHeader = req.headers.authorization;

    // إذا لم يوجد Authorization header
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

    // Authorization header غالبًا: "Bearer <token>"
    // split(' '): تقسيم النص عند المسافة لاستخراج التوكن
    const token = authHeader.split(' ')[1];

    // التحقق من صحة التوكن
    // jwt.verify: تتحقق من أن التوكن صالح وغير معدل
    // process.env.JWT_SECRET!: المفتاح السري المخزن في البيئة
    const payload: any = jwt.verify(token, process.env.JWT_SECRET!);

    // تمرير معلومات المستخدم إلى req.user
    (req as any).user = payload;

    // الانتقال للـ middleware التالي
    next();
  } catch (err) {
    // عند وجود خطأ في التوكن
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ---------------------------- الوظيفة الرئيسية لإنشاء التطبيق ----------------------------

// export: تصدير الدالة للاستخدام في ملفات أخرى
// const initializeApp = async () => {...}: دالة لإنشاء وإرجاع تطبيق Feathers
export const initializeApp = async () => {
  // feathers(): إنشاء تطبيق Feathers أساسي
  // express(feathers()): دمج Feathers مع Express
  const app = express(feathers());

  // -------------------- Middleware --------------------
  // bodyParser.json(): تحليل JSON في body
  app.use(bodyParser.json());

  // bodyParser.urlencoded(): تحليل form-urlencoded (مثل النماذج HTML)
  app.use(bodyParser.urlencoded({ extended: true }));

  // app.configure(express.rest()): تفعيل REST endpoints في Feathers
  // الفرق: بدون هذا لن تستطيع عمل REST على services
  app.configure(express.rest());

  // تقديم الملفات الثابتة (html, css, js)
  app.use(express.static(path.join(__dirname, '../public')));

  // -------------------- Services --------------------
  const userService = new UserServices(); // إدارة المستخدمين
  const videoService = new VideoService(); // إدارة الفيديوهات
  const categoryService = new CategoryService(); // إدارة الفئات
  const messageService = new MessageService(); // إدارة الرسائل

  // -------------------- REST routes إضافية --------------------

  // بحث المستخدمين
  app.get('/users/search', verifyJWTMiddleware, async (req : Request, res : Response) => {
    const q = req.query.q as string; // قراءة قيمة البحث من query string
    if (!q) return res.status(400).json({ error: 'Query missing' });

    const users = await userService.search(q); // استدعاء دالة البحث في الخدمة
    res.json(users);
  });

  // بحث الفيديوهات
  app.get('/videos/search', verifyJWTMiddleware, async (req: Request, res: Response) => {
    try {
      const { category, subcategory } = req.query as any;
      const query: any = {};
      if (category) query.category = category;
      if (subcategory) query.subcategory = subcategory;

      const videos = await videoService.find({ query }); // find: دالة Feathers للبحث
      res.json(videos);
    } catch (err) {
      res.status(500).json({ error: 'فشل البحث عن الفيديوهات' });
    }
  });
  // تغيير اسم المستخدم
  app.patch('/users/:id/change-username', verifyJWTMiddleware, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { newUsername } = req.body;
      const result = await userService.changeUsername(id, newUsername, { user: (req as any).user });
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  



  
  // -------------------- تسجيل الخدمات في التطبيق --------------------
  // app.use: تسجيل service على مسار معين
  // الفرق مع Express: هنا نستخدم Feathers Service وليس Route عادي
  app.use('/users', userService);
  app.use('/videos', videoService);
  app.use("/categories", categoryService);
  app.use('/messages', messageService);

  // -------------------- حماية الخدمات بواسطة hooks --------------------
  app.service('users').hooks({
    before: {
      get: [verifyJWT],       // حماية عملية get
      create: [verifyJWT],    // حماية عملية create
      patch: [verifyJWT],     // حماية عملية patch
      remove: [verifyJWT]     // حماية عملية remove
    },
  });

  app.service('videos').hooks({
    before: {
      all: [verifyJWT], // حماية كل العمليات
      patch: [
        async (context: HookContext) => {
          context.params.user = (context.params as any).user; // تمرير معلومات المستخدم
          return context;
        }
      ]
    }
  });

  app.service('messages').hooks({
    before: {
      find: [verifyJWT],
      get: [verifyJWT],
      create: [verifyJWT],
      remove: [verifyJWT]
    }
  });

  // -------------------- رفع الفيديوهات --------------------
  app.post('/videos/upload', verifyJWTMiddleware, upload.single('video'), async (req: Request, res: Response) => {
    try {
      const file = req.file; // الملف المرفوع
      const userId = (req as any).user.id; // استخراج id المستخدم من JWT

      if (!file) return res.status(400).json({ error: 'No file uploaded' });

      const video = await videoService.create({
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        subcategory: req.body.subcategory,
        filePath: file.path
      }, { user: { id: userId } }); // تمرير معلومات المستخدم للـ service

      res.json(video);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });
  // -------------------- Change Avatar --------------------
  app.post('/users/:id/change-avatar',verifyJWTMiddleware,upload.single('avatar'), // multer middleware
  async (req: any, res: any) => {
    try {
      const userService = new UserServices();
      const updated = await userService.changeAvatar(req.params.id, req.file, { user: req.user });
      res.json(updated);
    } catch (err: any) {
      console.error(err);
      res.status(400).json({ error: err.message });
    }
  }
  );

  // -------------------- الصفحة الرئيسية --------------------
  app.get('/', (_req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../public/index.html')); // إرسال index.html
  });

  // -------------------- إعداد Google OAuth + JWT --------------------
  setupAuth(app); // تهيئة المصادقة الخارجية + JWT

  return app;
};

// ---------------------------- ملاحظات عامة ----------------------------
/*
1. Feathers يوفر Services وHooks بينما Express يوفر Routes فقط.
2. كل Service لديه دوال CRUD جاهزة (find, get, create, patch, remove) + hooks.
3. عند الترقية إلى Feathers 5:
    - تسجيل الخدمات صار عن طريق app.configure(service()).
    - hooks أصبحت أكثر مرونة وإدارة الـ params أسهل.
    - express.rest() أقل حاجة له لأنه REST مدمج داخليًا.
    - body-parser يمكن استبداله بـ express.json() و express.urlencoded().
4. أمان:
    - verifyJWTMiddleware: يحمي REST routes.
    - verifyJWT hook: يحمي CRUD على services.
    - multer يستخدم dest محدد للملفات، يجب تنظيف الملفات لاحقًا.
*/
