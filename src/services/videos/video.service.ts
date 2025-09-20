// ---------------------------- Imports ----------------------------

// استيراد أنواع Feathers الأساسية
// Params: تمثل الـ query أو params المرسلة إلى الخدمة
// Id: يمثل أي معرف (_id) سواء string أو number
// ServiceMethods: واجهة Service CRUD (اختياري هنا)
import { Params, Id, ServiceMethods } from '@feathersjs/feathers';

// استيراد نموذج الفيديو وواجهة TypeScript الخاصة به
import { VideoModel, IVideo } from './video.model';

// استيراد نموذج المستخدم للربط بين الفيديو والمستخدم
import { UserModel } from '../users/user.model';

// Types: مكتبة Mongoose للتحقق من ObjectId أو إنشاءه
import { Types } from 'mongoose';

// استيراد Cloudinary SDK v2
// cloudinary: يستخدم لرفع الفيديوهات وتخزينها سحابيًا
import { v2 as cloudinary } from 'cloudinary';

// استيراد مكتبة fs (filesystem) من Node.js
// fs.unlinkSync: حذف الملفات المحلية بعد رفعها إلى Cloudinary
import fs from 'fs';

// استيراد multer لإدارة رفع الملفات مؤقتًا
import multer from 'multer';
const upload = multer({ dest: 'uploads/' }); // الملفات المؤقتة ستُخزن هنا

// ---------------------------- تعريف Service ----------------------------
export class VideoService {

    // find: دالة Feathers لإرجاع جميع الفيديوهات أو استعلام محدد
    async find(params?: Params) {
        // params?.query: قراءة أي query من الطلب (مثل category, uploader)
        const filter = params?.query || {};

        // VideoModel.find(filter): البحث عن الفيديوهات وفق الفلتر
        // populate('uploader', ...): إرجاع بيانات المستخدم المرتبط (name, email, avatar)
        return await VideoModel.find(filter).populate('uploader', 'name email avatar');
    }

    // get: إرجاع فيديو محدد حسب id
    async get(id: Id, params?: Params) {
        // التحقق من صحة الـ ObjectId
        if (!Types.ObjectId.isValid(id)) throw new Error('Invalid video ID');

        // البحث عن الفيديو مع البيانات المرتبطة بالمستخدم
        const video = await VideoModel.findById(id).populate('uploader', 'name email avatar');

        if (!video) throw new Error('Video not found');
        return video;
    }

    // create: رفع فيديو جديد
    async create(data: any, params?: Params) {
        const userId = params?.user?.id; // استخراج id المستخدم من JWT
        if (!userId) throw new Error('Unauthorized');

        // البحث عن المستخدم في DB باستخدام _id من التوكن
        const user = await UserModel.findById(userId);
        if (!user) throw new Error('User not found');

        const filePath = data.filePath; // مسار الملف المرفوع مؤقتًا
        if (!filePath) throw new Error('No file provided');

        // رفع الفيديو إلى Cloudinary
        const uploadResult = await cloudinary.uploader.upload(filePath, { resource_type: "video" });

        // إنشاء مستند فيديو جديد في MongoDB
        const video = await VideoModel.create({
            ...data,
            url: uploadResult.secure_url, // رابط الفيديو من Cloudinary
            uploader: user._id           // ربط الفيديو بالمستخدم
        });

        // حذف الملف المحلي بعد رفعه
        fs.unlinkSync(filePath);

        // إعادة الفيديو مع البيانات المرتبطة بالمستخدم
        return video.populate('uploader', 'name email avatar');
    }

    // remove: حذف فيديو
    async remove(id: string, params?: Params) {
        const userId = params?.user?.id;  // id المستخدم من JWT
        if (!userId) throw new Error('Unauthorized');

        if (!Types.ObjectId.isValid(id)) throw new Error('Invalid video ID');

        const video = await VideoModel.findById(id);
        if (!video) throw new Error('Video not found');

        const user = await UserModel.findById(userId) as any;
        if (!user) throw new Error('Unauthorized: User not found');

        // التأكد من أن المستخدم هو صاحب الفيديو
        if (video.uploader.toString() !== user._id.toString()) throw new Error('Forbidden');

        // حذف الفيديو من Cloudinary
        const publicId = video.url.split('/').slice(-1)[0].replace(/\.[^/.]+$/, "");
        await cloudinary.uploader.destroy(publicId, { resource_type: "video" });

        // حذف الفيديو من MongoDB
        await VideoModel.findByIdAndDelete(id);

        return { message: 'Video deleted', id };
    } 

    // patch: تعديل الفيديو أو تنفيذ actions مثل like/unlike
    async patch(id: Id, data: any, params?: Params) {
        if (!Types.ObjectId.isValid(id)) throw new Error('Invalid video ID');

        const video = await VideoModel.findById(id);
        if (!video) throw new Error('Video not found');

        const userId = params?.user?.id;
        if (!userId) throw new Error('Unauthorized');

        const userObjId = new Types.ObjectId(userId);

        // دعم action: like / unlike
        if (data.action === 'like') {
            if (!video.likedBy.some(id => id.equals(userObjId))) {
                video.likedBy.push(userObjId);
            }
        } else if (data.action === 'unlike') {
            video.likedBy = video.likedBy.filter(id => !id.equals(userObjId));
        } else {
            // تعديل أي بيانات أخرى
            Object.assign(video, data);
        }  

        await video.save();
        return video.populate('uploader', 'name email avatar');
    }
}

// ---------------------------- ملاحظات أمان وأداء ----------------------------

/*
1. كل دالة تتحقق من صحة ObjectId قبل أي عملية لتجنب أخطاء MongoDB.
2. create/remove/patch تستخدم params.user.id للتحقق من هوية المستخدم عبر JWT.
3. remove: يتحقق أن صاحب الفيديو فقط يمكنه حذفه.
4. create: يرفع الفيديو إلى Cloudinary ثم يحذف الملف المحلي.
5. patch: تدعم like/unlike بدون تكرار.
6. find/get: تستخدم populate لجلب بيانات المستخدم المرتبط.
7. تحسينات مقترحة:
    - إضافة pagination في find() لتجنب جلب كل الفيديوهات دفعة واحدة.
    - التعامل مع أخطاء Cloudinary داخل try/catch منفصل.
    - التحقق من حجم ونوع الفيديو قبل الرفع.
8. عند الترقية إلى Feathers 5:
    - يمكن استخدام هذه الدوال داخل Service class تمتد من ServiceMethods<IVideo>.
    - يمكن إضافة hooks مباشرة في class لحماية كل دالة بالـ JWT.
*/
