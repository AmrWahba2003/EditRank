// ---------------------------- Imports ----------------------------

// استيراد من Mongoose
// Schema: لبناء هيكل المستندات (documents) في MongoDB
// model: لإنشاء نموذج (model) للتعامل مع قاعدة البيانات
// Document: واجهة TypeScript تمثل مستند Mongoose (_id, save(), etc)
import { Schema, model, Document } from "mongoose";

// ---------------------------- تعريف واجهة TypeScript ----------------------------

// ICategory: واجهة TypeScript لتعريف شكل التصنيف
export interface ICategory extends Document {
  name: string;            // اسم التصنيف (مثل "Games")
  subcategories: string[]; // قائمة الفئات الفرعية (مثل ["GTA V", "FIFA", "COD"])
}

// ---------------------------- إنشاء Schema ----------------------------

const categorySchema = new Schema<ICategory>({
    // name: اسم التصنيف، مطلوب وفريد لمنع التكرار
    name: { type: String, required: true, unique: true },

    // subcategories: قائمة الفئات الفرعية، كل عنصر مطلوب
    subcategories: [{ type: String, required: true }]
});

// ---------------------------- إنشاء Model ----------------------------

// CategoryModel: نموذج Mongoose للتعامل مع مجموعة التصنيفات
// 'Category': اسم collection في MongoDB (سيصبح 'categories' تلقائيًا)
export const CategoryModel = model<ICategory>("Category", categorySchema);

// ---------------------------- ملاحظات أمان وأداء ----------------------------

/*
1. unique: يضمن عدم تكرار اسم التصنيف في قاعدة البيانات.
2. required: يضمن أن كل تصنيف يحتوي على name و subcategories.
3. subcategories: تخزينها كمصفوفة من Strings لتسهيل البحث والفلترة.
4. تحسينات مقترحة:
    - إضافة index على name لتحسين سرعة البحث.
    - التحقق من طول المصفوفة أو قيم الفئات الفرعية قبل الحفظ.
5. عند الترقية إلى Feathers 5:
    - يمكن استخدام هذا النموذج مباشرة في Service class.
    - يمكن إضافة hooks للتحقق من JWT قبل create أو patch إذا أردنا تقييد التعديلات.
6. هذا النموذج بسيط، لا يحتوي على علاقات مع Models أخرى، لكن يمكن توسيعه مستقبليًا لإضافة روابط مع الفيديوهات.
*/
