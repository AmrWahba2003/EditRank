// ---------------------------- Imports ----------------------------

// استيراد أنواع Feathers الأساسية
// Params: تمثل بيانات الاستعلام أو params المرسلة للخدمة
// Id: نوع يمثل معرف أي مستند (string | number)
import { Params, Id } from '@feathersjs/feathers';

// استيراد نموذج الرسائل
import { MessageModel } from './message.model';

// Types: مكتبة Mongoose لإنشاء ObjectId والتحقق منه
import { Types } from 'mongoose';

// ---------------------------- تعريف خدمة الرسائل ----------------------------
export class MessageService {

    // -------------------- find --------------------
    // جلب جميع الرسائل بين المستخدم الحالي ومستخدم آخر
    // endpoint: GET /messages?with=<otherUserId>
    async find(params?: Params) {
        // الحصول على id المستخدم من JWT
        const userId = params?.user?.id;
        if (!userId) throw new Error('Unauthorized');

        // الحصول على id المستخدم الآخر من query param
        const other = params?.query?.with as string;
        if (!other) throw new Error('Missing "with" query param');

        // إنشاء conversationId ثابت لكل محادثة بين المستخدمين
        // ترتيب IDs لضمان نفس الـ conversationId مهما كان ترتيب المستخدمين
        const conversationId = [userId, other].sort().join('_');

        // البحث عن الرسائل في DB وترتيبها حسب createdAt تصاعديًا
        // populate: جلب بيانات المستخدمين المرتبطين بالرسائل (from, to)
        return await MessageModel.find({ conversationId })
            .sort({ createdAt: 1 })
            .populate('from', 'name username avatar')
            .populate('to', 'name username avatar');
    }

    // -------------------- create --------------------
    // إنشاء رسالة جديدة
    async create(data: any, params?: Params) {
        const userId = params?.user?.id;
        if (!userId) throw new Error('Unauthorized');

        // استخراج بيانات المستلم ومحتوى الرسالة من payload
        const { to, content } = data;
        if (!to || !content) throw new Error('Invalid payload');

        // إنشاء conversationId ثابت بين المستخدمين
        const conversationId = [userId, to].sort().join('_');

        // إنشاء مستند رسالة جديد في MongoDB
        const created = await MessageModel.create({
            conversationId,
            from: new Types.ObjectId(userId),
            to: new Types.ObjectId(to),
            content
        });

        // إرجاع الرسالة بعد populate بيانات المستخدمين المرتبطين
        return await MessageModel.findById(created._id)
            .populate('from', 'name username avatar')
            .populate('to', 'name username avatar');
    }

    // -------------------- get --------------------
    // إرجاع رسالة واحدة حسب الـ id
    async get(id: Id, params?: Params) {
        return await MessageModel.findById(id);
    }

    // -------------------- patch --------------------
    // تعديل الرسالة (مثل تعديل النص)
    async patch(id: Id, data: any, params?: Params) {
        return await MessageModel.findByIdAndUpdate(id, data, { new: true });
        // { new: true } لإرجاع المستند بعد التعديل
    }

    // -------------------- remove --------------------
    // حذف الرسالة حسب id
    async remove(id: Id, params?: Params) {
        return await MessageModel.findByIdAndDelete(id);
    }
}

// ---------------------------- ملاحظات أمان وأداء ----------------------------

/*
1. find() تتحقق من JWT قبل الوصول للرسائل.
2. create() تتحقق من وجود المستخدم والمستلم ومحتوى الرسالة قبل الإنشاء.
3. conversationId: تقنية ذكية لإنشاء محادثة فريدة بين أي مستخدمين.
4. populate: لجلب بيانات المستخدمين المرتبطين بالرسائل دون الحاجة لاستعلام إضافي.
5. patch/remove: لا يوجد تحقق من ملكية الرسالة، يُنصح بإضافة hook للتحقق أن المستخدم هو المرسل أو المرسل إليه.
6. تحسينات مقترحة:
    - إضافة pagination و limit في find() لتقليل حجم البيانات.
    - التحقق من حجم المحتوى أو length content قبل create().
    - إضافة timestamps: createdAt, updatedAt (إذا لم يتم إضافتها في Schema).
7. عند الترقية إلى Feathers 5:
    - يمكن استخدام Service class مع hooks للتحقق من JWT قبل كل عملية.
    - يمكن حماية create/patch/remove عبر hooks لضمان أمان البيانات.
*/
