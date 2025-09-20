// ---------------------------- Imports ----------------------------

// استيراد من Mongoose
// Schema: لبناء هيكل المستندات (documents) في MongoDB
// model: لإنشاء نموذج (model) للتعامل مع قاعدة البيانات
// Document: واجهة TypeScript تمثل مستند Mongoose (_id, save(), etc)
// Types: لإنشاء ObjectId والتحقق منه
import { Schema, model, Document, Types } from 'mongoose';

// ---------------------------- تعريف واجهة TypeScript ----------------------------

// IMessage: واجهة TypeScript لتمثيل رسالة
export interface IMessage extends Document {
    conversationId: string;       // معرف المحادثة (conversation) بين المستخدمين
    from: Types.ObjectId;         // المستخدم المرسل
    to: Types.ObjectId;           // المستخدم المستقبل
    content: string;              // محتوى الرسالة
    read: boolean;                // حالة القراءة
    createdAt: Date;              // تاريخ الإنشاء
}

// ---------------------------- إنشاء Schema ----------------------------

const messageSchema = new Schema<IMessage>({
    conversationId: { type: String, required: true, index: true }, 
    // index: لتسريع البحث عن المحادثات
    from: { type: Schema.Types.ObjectId, ref: 'User', required: true }, 
    // ref: 'User' لربط المرسل بالمستخدم
    to: { type: Schema.Types.ObjectId, ref: 'User', required: true },   
    // ref: 'User' لربط المستقبل بالمستخدم
    content: { type: String, required: true },  // محتوى الرسالة مطلوب
    read: { type: Boolean, default: false }     // حالة القراءة افتراضية false
}, {
    // timestamps: إنشاء createdAt تلقائيًا، بدون updatedAt
    timestamps: { createdAt: true, updatedAt: false },
});

// ---------------------------- إنشاء Model ----------------------------

// MessageModel: نموذج Mongoose للتعامل مع مجموعة الرسائل
// 'Message': اسم collection في MongoDB (سيصبح 'messages' تلقائيًا)
export const MessageModel = model<IMessage>('Message', messageSchema);

// ---------------------------- ملاحظات أمان وأداء ----------------------------

/*
1. conversationId: حقل ثابت لكل محادثة بين المستخدمين لتسهيل البحث.
2. index: تحسين سرعة البحث في DB عند استخدام find() مع conversationId.
3. from / to: ObjectId مرتبط بالمستخدمين عبر ref 'User' لتسهيل populate.
4. content: محتوى الرسالة يجب التحقق من الطول قبل create() لتجنب الرسائل الكبيرة جدًا.
5. read: افتراضيًا false، يمكن تحديثه عند قراءة الرسالة من قبل المستقبل.
6. timestamps: حفظ createdAt تلقائيًا لتسهيل ترتيب الرسائل حسب الوقت.
7. تحسينات مقترحة:
    - إضافة hooks في Service للتحقق من JWT قبل أي عملية.
    - التحقق من ملكية الرسالة عند patch/remove.
    - يمكن إضافة pagination عند جلب الرسائل لتجنب جلب آلاف الرسائل دفعة واحدة.
8. عند الترقية إلى Feathers 5:
    - يمكن استخدام هذا النموذج مباشرة داخل Service class مع hooks.
    - populate يمكن استخدامه في hooks أو داخل Service methods عند find/create.
*/
