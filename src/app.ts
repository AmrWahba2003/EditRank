// src/app.ts
import feathers from '@feathersjs/feathers';
import express from '@feathersjs/express';
import bodyParser from 'body-parser';
import path from 'path';
import jwt from 'jsonwebtoken';
import { setupAuth } from './app/google.auth';
import { verifyJWT } from './app/jwt.middleware';
import { VideoService } from './services/videos/video.service';
import { UserServices } from './services/users/user.service';
import { Request, Response, NextFunction } from 'express';
import { HookContext } from '@feathersjs/feathers';
import { CategoryService } from "./services/categories/category.service";
import multer from 'multer';
const upload = multer({ dest: 'uploads/' });

// 🟢 Middleware للتحقق من JWT في REST endpoint
const verifyJWTMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    const payload: any = jwt.verify(token, process.env.JWT_SECRET!);

    (req as any).user = payload;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const initializeApp = async () => {
  const app = express(feathers());


  // 🔹 Middleware
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.configure(express.rest());
  app.use(express.static(path.join(__dirname, '../public')));

  // 🔹 تهيئة الخدمات
  // 🔹 Services
    const userService = new UserServices();
    const videoService = new VideoService();
    const categoryService = new CategoryService();

      // 🔹 تهيئة الخدمات
    app.get('/users/search', verifyJWTMiddleware, async (req : Request, res : Response) => {
        const q = req.query.q as string;
        if (!q) return res.status(400).json({ error: 'Query missing' });

        const users = await userService.search(q);
        res.json(users);
    });
    // داخل initializeApp() بعد تهيئة الفيديوهات والفئات
    app.get('/videos/search', verifyJWTMiddleware, async (req: Request, res: Response) => {
      try {
        const { category, subcategory } = req.query as any;
        const query: any = {};
        if (category) query.category = category;
        if (subcategory) query.subcategory = subcategory;

        const videos = await videoService.find({ query });
        res.json(videos);
      }  catch (err) {
        res.status(500).json({ error: 'فشل البحث عن الفيديوهات' });
      }
    });
    
    app.use('/users', userService);
    app.use('/videos', videoService);
    app.use("/categories", categoryService);


  // 🔹 Hooks لحماية الخدمات
    app.service('users').hooks({
  before: {
    get: [verifyJWT],
    create: [verifyJWT],
    patch: [verifyJWT],
    remove: [verifyJWT]
  },
    });
    app.service('videos').hooks({
      before: {
      all: [verifyJWT],
      patch: [
        async (context: HookContext) => {
          // تمرير الـ user من request إلى params
          context.params.user = (context.params as any).user;
          return context;
        }
      ]
      }
  });

    app.post('/videos/upload', verifyJWTMiddleware, upload.single('video'), async (req: Request, res: Response) => {
        try {
        const file = req.file;
        const userId = (req as any).user.id;

        if (!file) return res.status(400).json({ error: 'No file uploaded' });

        const video = await videoService.create({
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        subcategory: req.body.subcategory,
        filePath: file.path
      }, { user: { id: userId } });

          res.json(video);
      } catch (err: any) {
          res.status(400).json({ error: err.message });
      }
      });
      // 🔹 الصفحة الرئيسية
      app.get('/', (_req: Request, res: Response) => {
          res.sendFile(path.join(__dirname, '../public/index.html'));
      });

    // 🔹 إعداد Google OAuth + JWT
    setupAuth(app);

  return app;
};
