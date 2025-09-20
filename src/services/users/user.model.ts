// ---------------------------- Imports ----------------------------

// import: استيراد من مكتبة mongoose
// Schema: لبناء هيكل (schema) للمستندات في MongoDB
// model: لإنشاء نموذج (model) يمكن استخدامه للتعامل مع DB
// Document: واجهة TypeScript تمثل مستند Mongoose (تحتوي على _id, save(), etc)
import { Schema, model, Document } from 'mongoose';

// ---------------------------- تعريف واجهة TypeScript ----------------------------

// IUser: واجهة TypeScript لتعريف شكل بيانات المستخدم
// extends Document: تضمين خصائص Mongoose Document (_id, save, etc)
export interface IUser extends Document {
    googleId: string;   // معرف المستخدم من Google OAuth
    name: string;       // اسم المستخدم
    email: string;      // البريد الإلكتروني
    avatar?: string;    // رابط الصورة الشخصية (اختياري)
    username: string;   // اسم المستخدم الخاص بالنظام
}

// ---------------------------- إنشاء الـ Schema ----------------------------

const userSchema = new Schema<IUser>({
    // googleId: حقل نوعه String، مطلوب وفريد
    googleId: { type: String, required: true, unique: true },

    // name: حقل الاسم، نوعه String، مطلوب
    name: { type: String, required: true },

    // email: البريد الإلكتروني، مطلوب وفريد
    email: { type: String, required: true, unique: true },

    // avatar: رابط الصورة، اختياري
    avatar: { type: String },

    // username: اسم المستخدم داخل النظام، مطلوب وفريد
    username: { type: String, required: true, unique: true },
});

// ---------------------------- إنشاء الـ Model ----------------------------

// UserModel: نموذج Mongoose يمكن استخدامه للعمليات CRUD
// 'User': اسم المجموعة (collection) في MongoDB سيتم تحويله تلقائيًا إلى 'users'
// userSchema: الهيكل الذي يحدد الحقول والأنواع والقواعد
export const UserModel = model<IUser>('User', userSchema);

// ---------------------------- ملاحظات أمان وأداء ----------------------------

/*
1. unique: يضمن عدم تكرار googleId أو email أو username في قاعدة البيانات.
2. required: يضمن أن الحقول الأساسية لن تكون فارغة عند إنشاء مستخدم.
3. TypeScript interface IUser: يساعد على التحقق من الأنواع عند التعامل مع البيانات في الكود.
4. يفضل إضافة Index على email وusername لتحسين سرعة البحث.
5. يمكن إضافة hooks مثل pre('save') لتشفير أي بيانات حساسة أو تعديلها قبل الحفظ.
6. عند الترقية إلى Feathers 5:
    - يمكن استخدام هذا النموذج مباشرة في Service class.
    - Hooks يمكن أن تتحقق من صحة البيانات قبل create أو patch.
7. يمكن ربط هذا النموذج بـ JWT عند تسجيل الدخول لإرجاع بيانات المستخدم مع توكن.
*/
