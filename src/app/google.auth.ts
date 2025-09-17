// src/app/google.auth.ts
import { UserModel } from '../services/users/user.model'; // استيراد نموذج المستخدم
import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';

export const setupAuth = (app: any) => {
  
  async function generateUniqueUsername(name: string, email: string) {
    let base = (name || email.split('@')[0]).toLowerCase().replace(/\s+/g, '');
    base = base.replace(/[^a-z0-9]/g, '');
    let username = base;
    let exists = await UserModel.findOne({ username });
    let counter = 1;
    while (exists) {
      username = base + counter;
      exists = await UserModel.findOne({ username });
      counter++;
    }
  return username;
}
  // تهيئة استراتيجية Google OAuth
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile: Profile, done) => {
        try {
          const email = profile.emails?.[0]?.value || 'no-email@example.com';
          const avatar = profile.photos?.[0]?.value || '';

          // البحث عن المستخدم في قاعدة البيانات
          let user = await UserModel.findOne({ googleId: profile.id });
          if (!user) {
            const username = await generateUniqueUsername(profile.displayName || '', email);
            // إنشاء مستخدم جديد إذا لم يكن موجود
            user = await UserModel.create({
              googleId: profile.id,
              name: profile.displayName || 'Unknown Name',
              email,
              avatar,
              username,
            });
          }

          done(null, user); // تمرير المستخدم إلى Passport
        } catch (err) {
          done(err, undefined);
        }
      }
    )
  );

  app.use(passport.initialize());

  // بدء عملية OAuth
  app.get(
    '/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  // مسار callback بعد تسجيل الدخول
  app.get(
    '/oauth/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/' }),
    (req: any, res: any) => {
      const user: any = req.user;

      // إنشاء JWT للتوثيق
      const token = jwt.sign(
        { id: user._id, email: user.email, avatar: user.avatar, name: user.name , username: user.username},
        process.env.JWT_SECRET!,
        { expiresIn: '3h' }
      );
      console.log(token)
      // إعادة توجيه المستخدم للفرونت وحفظ التوكن في localStorage
      res.send(`
        <html>
          <body>
            <script>
              localStorage.setItem('jwt', '${token}');
              window.location.href = '/home.html';
            </script>
          </body>
        </html>
      `);
    }
  );
};
