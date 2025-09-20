// ---------------------------- Imports ----------------------------

// استيراد أنواع Feathers الأساسية
// Params: تمثل الـ query أو params المرسلة إلى الخدمة
// Id: يمثل أي معرف (_id) سواء string أو number
import { Params, Id } from "@feathersjs/feathers";

// استيراد نموذج التصنيفات
import { CategoryModel } from "./category.model";

// ---------------------------- تعريف خدمة التصنيفات ----------------------------
export class CategoryService {

    // -------------------- find --------------------
    // جلب جميع التصنيفات
    // يمكن إضافة params.query لتصفية أو البحث مستقبليًا
    async find(params?: Params) {
        // CategoryModel.find(): استرجاع جميع المستندات من مجموعة التصنيفات
        return await CategoryModel.find();
    }

    // -------------------- get --------------------
    // جلب تصنيف واحد حسب معرفه (id)
    async get(id: Id, params?: Params) {
        // CategoryModel.findById(id): البحث عن المستند حسب _id
        return await CategoryModel.findById(id);
    }

    // -------------------- create --------------------
    // إنشاء تصنيف جديد
    async create(data: any, params?: Params) {
        // CategoryModel.create(data): إضافة مستند جديد في MongoDB
        // data: يجب أن يحتوي على الحقول المطلوبة في schema
        return await CategoryModel.create(data);
    }
}

// ---------------------------- ملاحظات أمان وأداء ----------------------------

/*
1. find(): يمكن إضافة pagination وlimit لتقليل حجم البيانات عند وجود الكثير من التصنيفات.
2. get(): يفضل التحقق من صحة ObjectId قبل استدعاء findById لمنع أخطاء MongoDB.
3. create(): يجب التحقق من صحة الحقول المطلوبة (مثل name) قبل create().
4. تحسينات مقترحة:
    - إضافة hooks للتحقق من JWT قبل create لتقييد إنشاء التصنيفات للمسؤولين فقط.
    - إضافة فلاتر في find لتمكين البحث عن تصنيفات محددة.
5. عند الترقية إلى Feathers 5:
    - يمكن أن يمتد CategoryService من ServiceMethods مع typing قوي.
    - hooks يمكن إضافتها داخل class أو في app.ts لحماية كل دالة.
6. هذا الكود بسيط مقارنة بخدمات أخرى (Videos, Messages) لأنه لا يحتوي على علاقات أو عمليات معقدة.
*/
