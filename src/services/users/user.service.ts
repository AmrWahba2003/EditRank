// ---------------------------- Imports ----------------------------

// استيراد أنواع Feathers الأساسية
// Params: يمثل بيانات الاستعلام أو الـ params المرسلة للخدمة
// Id: نوع يمثل الـ id لأي كائن (string | number)
// ServiceMethods: واجهة لتعريف الخدمات CRUD
import { Params, Id, ServiceMethods } from '@feathersjs/feathers';

// استيراد UserModel وواجهة IUser
// UserModel: نموذج Mongoose لمستخدم
// IUser: واجهة TypeScript لتحديد شكل بيانات المستخدم
import { UserModel, IUser } from './user.model';

// استيراد VideoModel لمقارنة أو جلب الفيديوهات الخاصة بالمستخدم
import { VideoModel } from '../videos/video.model';

// Types: مكتبة من Mongoose للتحقق من ObjectId
import { Types } from 'mongoose';

// استيراد hook للتحقق من JWT (يستخدم عادة في app.ts أو قبل العمليات)
import { verifyJWT } from '../../app/jwt.middleware';

// استيراد مكتبة jsonwebtoken لإنشاء JWT أو التحقق منه
import jwt from 'jsonwebtoken';

import { MessageModel } from '../messages/message.model';

// ---------------------------- تعريف الخدمة ----------------------------
export class UserServices {
    
    // find: دالة Feathers لإرجاع جميع المستخدمين
    // params?: Params: يمكن إرسال فلترة أو pagination أو query
    async find(params?: Params) {
        // UserModel.find(): جلب كل المستخدمين من قاعدة البيانات
        return await UserModel.find();
    }

    // get: دالة Feathers لإرجاع مستخدم محدد حسب id
    async get(id: Id, params?: Params) {
        // التحقق من صحة الـ ObjectId
        if (!Types.ObjectId.isValid(id)) throw new Error('Invalid user ID');
        // البحث عن المستخدم حسب id
        const user = await UserModel.findById(id);
        // إذا لم يوجد المستخدم
        if (!user) throw new Error('User not found');
        // البحث عن الفيديوهات التي رفعها المستخدم
        // uploader: id المستخدم
        // بدون populate، أي يرجع فقط الـ ObjectId للفيديوهات
        const videos = await VideoModel.find({ uploader: id });
        // دمج بيانات المستخدم مع الفيديوهات وإرجاعها
        // user.toObject(): تحويل مستند Mongoose إلى JSON عادي
        return { ...user.toObject(), videos };
    }

    async remove(id: Id, params?: Params) {
        if(!Types.ObjectId.isValid(id)) throw new Error('Invalid user ID');

        const videos = await VideoModel.deleteMany({ uploader: id });

        const masseges = await MessageModel.deleteMany({ $or: [ { from: id }, { to: id } ] });

        const user = await UserModel.findByIdAndDelete(id);
        if(!user) throw new Error('User not found');

        return user;
    }
    // search: دالة للبحث عن المستخدمين باسم أو username
    async search(query: string) {
        return await UserModel.find({
            $or: [
                // البحث في حقل name باستخدام regex (غير حساس للحروف الكبيرة)
                { name: { $regex: query, $options: 'i' } },
                // البحث في حقل username بنفس الطريقة
                { username: { $regex: query, $options: 'i' } }
            ] 
        })
        // تحديد الحقول التي سيتم إرجاعها فقط (name, username, avatar)
        .select('name username avatar');
    }
}

// ---------------------------- ملاحظات أمان وميزات ----------------------------

/*
1. جميع الدوال تستخدم async/await للتعامل مع العمليات غير المتزامنة مع Mongoose.
2. في get() تم التحقق من ObjectId لضمان عدم تمرير id خاطئ.
3. search() يستخدم regex مع $options: 'i' لجعل البحث غير حساس لحالة الأحرف.
4. Videos مرتبط بالمستخدم عن طريق uploader، لكن بدون populate يمكن تحسين الأداء.
5. عند الترقية إلى Feathers 5:
    - يمكن تعريف Service بشكل class يمتد من ServiceMethods<IUser> لتقليل الأخطاء TypeScript.
    - يمكن إضافة hooks مباشرة داخل Service أو في app.ts لحماية find/get/search بواسطة verifyJWT.
6. الأمان:
    - يجب التأكد من تمرير verifyJWT على أي دالة تعرض بيانات شخصية.
    - يمكن إضافة limit أو pagination في find() لتجنب جلب ملايين المستخدمين دفعة واحدة.
7. التفاعل مع JWT:
    - يمكن إنشاء توكن عند تسجيل مستخدم أو تسجيل الدخول وإرجاعه مع بيانات المستخدم.
*/
