// ---------------------------- Imports ----------------------------

// استيراد نموذج المستخدم للتعامل مع MongoDB
import { UserModel } from '../services/users/user.model';

// استيراد Passport.js لإدارة OAuth
import passport from 'passport';

// استيراد استراتيجية Google OAuth
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';

// استيراد jwt لإنشاء JSON Web Tokens للمصادقة
import jwt from 'jsonwebtoken';

// ---------------------------- setupAuth ----------------------------

export const setupAuth = (app: any) => {

  // -------------------- دالة لتوليد username فريد --------------------
  async function generateUniqueUsername(name: string, email: string) {
    // إنشاء قاعدة username من الاسم أو البريد
    let base = (name || email.split('@')[0]).toLowerCase().replace(/\s+/g, '');
    base = base.replace(/[^a-z0-9]/g, ''); // إزالة الأحرف غير المسموح بها
    let username = base;

    // التحقق من وجود نفس الاسم في قاعدة البيانات
    let exists = await UserModel.findOne({ username });
    let counter = 1;

    // إذا كان موجودًا بالفعل، أضف رقمًا لعمل اسم فريد
    while (exists) {
      username = base + counter;
      exists = await UserModel.findOne({ username });
      counter++;
    }

    return username; // إعادة username الفريد
  }

  // -------------------- تهيئة استراتيجية Google OAuth --------------------
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,       // Client ID من Google
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!, // Client Secret من Google
        callbackURL: process.env.GOOGLE_CALLBACK_URL,  // مسار العودة بعد تسجيل الدخول
      },
      async (_accessToken, _refreshToken, profile: Profile, done) => {
        try {
          // الحصول على البريد والصورة من ملف تعريف Google
          const email = profile.emails?.[0]?.value || 'no-email@example.com';
          const avatar = profile.photos?.[0]?.value || '';

          // البحث عن المستخدم في قاعدة البيانات
          let user = await UserModel.findOne({ googleId: profile.id });

          if (!user) {
            // إنشاء username فريد
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

          // تمرير المستخدم إلى Passport
          done(null, user);

        } catch (err) {
          done(err, undefined);
        }
      }
    )
  );

  // -------------------- تهيئة Passport --------------------
  app.use(passport.initialize());

  // -------------------- مسار بدء عملية OAuth --------------------
  // GET /auth/google → إعادة توجيه المستخدم لتسجيل الدخول عبر Google
  app.get(
    '/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  // -------------------- مسار callback بعد تسجيل الدخول --------------------
  app.get(
    '/oauth/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/' }),
    (req: any, res: any) => {
      const user: any = req.user;

      // إنشاء JWT للتوثيق لمدة 3 ساعات
      const token = jwt.sign(
        {
          id: user._id,
          email: user.email,
          avatar: user.avatar,
          name: user.name,
          username: user.username
        },
        process.env.JWT_SECRET!,
        { expiresIn: '3h' }
      );

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

// ---------------------------- ملاحظات أمان وأداء ----------------------------

/*
1. Passport GoogleStrategy:
    - يتيح تسجيل الدخول باستخدام Google OAuth بسهولة.
    - profile: يحتوي على بيانات المستخدم من Google (id, name, email, photos).

2. generateUniqueUsername:
    - يضمن عدم تكرار أسماء المستخدمين في قاعدة البيانات.
    - يزيل الأحرف غير المسموح بها ويضيف أرقام عند الحاجة.

3. JWT:
    - إنشاء توكن بعد تسجيل الدخول لتوثيق المستخدم في باقي الخدمات.
    - expiresIn: يحدد مدة صلاحية التوكن (هنا 3 ساعات).

4. إعادة التوجيه للفرونت:
    - يستخدم localStorage لحفظ JWT على جهاز المستخدم.
    - يمكن تعديله لاستخدام cookies أو أي طريقة أخرى للتخزين.

5. تحسينات مقترحة:
    - إضافة hooks للتحقق من JWT في جميع الخدمات بعد تسجيل الدخول.
    - تحقق من email_verified من Google قبل إنشاء المستخدم.
    - دعم تسجيل الخروج وإبطال التوكن.

6. عند الترقية إلى Feathers 5:
    - نفس الكود يعمل، لكن يمكن دمج Passport hooks مباشرة مع services.
    - يمكن استخدام JWT مباشرة مع sockets وREST endpoints بدون تغيير كبير.

7. أمان:
    - تأكد من حماية process.env.JWT_SECRET و Google Client Secret.
    - منع أي شخص من تعديل localStorage مباشرة أو إعادة استخدام JWT من جهاز آخر.
*/
