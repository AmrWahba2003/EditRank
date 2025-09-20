// ---------------------------- Imports ----------------------------

// استيراد من Mongoose
// Schema: لإنشاء هيكل المستندات (document structure) في MongoDB
// model: لإنشاء نموذج (model) يمكن استخدامه للعمليات CRUD
// Document: واجهة TypeScript لتمثيل المستند (تحتوي على _id, save(), etc)
// Types: لتحديد ObjectId في Mongoose
import { Schema, model, Document, Types } from 'mongoose';

// ---------------------------- تعريف واجهة TypeScript ----------------------------

// IVideo: واجهة لتحديد شكل الفيديو في TypeScript
export interface IVideo extends Document {
    title: string;               // عنوان الفيديو (مطلوب)
    description?: string;        // وصف الفيديو (اختياري)
    category: string;            // الفئة الرئيسية
    subcategory: string;         // الفئة الفرعية
    url: string;                 // رابط الفيديو في Cloudinary
    thumbnail?: string;          // رابط الصورة المصغرة (اختياري)
    likes: number;               // عدد الإعجابات (virtual field)
    uploader: Types.ObjectId;    // المستخدم الذي رفع الفيديو
    createdAt: Date;             // تاريخ الإنشاء
    likedBy: Types.ObjectId[];   // قائمة المستخدمين الذين أعجبوا بالفيديو
}

// ---------------------------- إنشاء Schema ----------------------------

const videoSchema = new Schema<IVideo>({
    title: { type: String, required: true },               // حقل title مطلوب
    description: { type: String },                         // حقل description اختياري
    category: { type: String, required: true },            // category مطلوب
    subcategory: { type: String, required: true },         // subcategory مطلوب
    url: { type: String, required: true },                 // رابط الفيديو في Cloudinary
    thumbnail: { type: String },                            // رابط الصورة المصغرة اختياري
    uploader: { type: Schema.Types.ObjectId, ref: 'User', required: true }, 
    // ref: 'User' لربط الفيديو بالمستخدم الذي رفعه
    createdAt: { type: Date, default: Date.now },          // تاريخ الإنشاء الافتراضي
    likedBy: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }] 
    // قائمة ObjectId للمستخدمين الذين أعجبوا بالفيديو، فارغة افتراضيًا
},
{ 
    timestamps: true,             // لإنشاء createdAt و updatedAt تلقائيًا
    toJSON: { virtuals: true },   // لتضمين virtual fields عند التحويل إلى JSON
    toObject: { virtuals: true }  // لتضمين virtual fields عند التحويل إلى Object
});

// ---------------------------- Virtual Fields ----------------------------

// virtual: لإنشاء حقل افتراضي لا يتم تخزينه في DB
// هنا نستخدمه لحساب عدد الإعجابات بناءً على طول likedBy array
videoSchema.virtual('likes').get(function () {
    return this.likedBy.length;
});

// ---------------------------- إنشاء Model ----------------------------

// VideoModel: نموذج Mongoose لإجراء عمليات CRUD على مجموعة الفيديوهات
// 'Video': اسم collection في MongoDB (سيصبح 'videos' تلقائيًا)
export const VideoModel = model<IVideo>('Video', videoSchema);

// ---------------------------- ملاحظات أمان وأداء ----------------------------

/*
1. likedBy: تخزين ObjectId للمستخدمين بدلاً من بيانات كاملة لتقليل حجم البيانات.
2. virtual field likes: يحسب عدد الإعجابات ديناميكيًا بدون تخزينها في DB.
3. timestamps: تسهل تتبع وقت إنشاء وتحديث الفيديوهات.
4. uploader: ربط الفيديو بالمستخدم يسمح بالـ populate لاحقًا لجلب بيانات المستخدم.
5. تحسينات مقترحة:
    - إضافة pagination في find() لتجنب جلب كل الفيديوهات دفعة واحدة.
    - إضافة index على category وsubcategory لتسريع البحث.
    - التحقق من حجم ونوع الفيديو قبل رفعه على Cloudinary.
6. الترقية إلى Feathers 5:
    - يمكن استخدام هذا النموذج داخل Service class مع hooks للتحقق من JWT قبل create/remove/patch.
    - populate يمكن استخدامه في hooks أو في Service methods مباشرة.
7. حذف index خاطئ: تم عمل تعليق على كود حذف index مؤقت، يمكن تشغيله مرة واحدة لإزالة أي index خاطئ.
*/
