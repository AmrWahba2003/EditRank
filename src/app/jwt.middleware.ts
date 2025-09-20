// ---------------------------- Imports ----------------------------

// استيراد HookContext من Feathers
// HookContext: يحتوي على معلومات الطلب، params، data، result، إلخ
import { HookContext } from '@feathersjs/feathers';

// استيراد jwt للتحقق من صحة التوكنات
import jwt from 'jsonwebtoken';

// ---------------------------- Hook verifyJWT ----------------------------

export const verifyJWT = async (context: HookContext) => {
    // استخراج params من context
    const { params } = context;

    // -------------------- قراءة Authorization header --------------------
    // params.headers يحتوي على جميع رؤوس الطلب
    // Authorization header يجب أن يكون بالشكل: "Bearer <token>"
    const authHeader = params.headers?.authorization;

    // إذا لم يوجد Authorization header، نرمي خطأ
    if (!authHeader) {
        throw new Error('Unauthorized: No Authorization header');
    }

    // استخراج التوكن من "Bearer <token>"
    const token = authHeader.split(' ')[1];

    try {
        // التحقق من صحة JWT
        // process.env.JWT_SECRET!: سر JWT المخزن في environment
        const payload: any = jwt.verify(token, process.env.JWT_SECRET!);

        // -------------------- تمرير بيانات المستخدم --------------------
        // params.user: مكان مناسب لتخزين بيانات المستخدم في hooks
        params.user = { id: payload.id, email: payload.email };

        // -------------------- إرجاع context --------------------
        // كل hook يجب أن يرجع context بعد التعديل
        return context;

    } catch (err) {
        // إذا فشل التحقق، رمي خطأ
        throw new Error('Unauthorized: Invalid token');
    }
};

// ---------------------------- ملاحظات أمان وأداء ----------------------------

/*
1. هذا hook يحمي أي خدمة Feathers (users, videos, messages...) عبر verifyJWT قبل تنفيذ العمليات.
2. مقارنة مع Express middleware:
    - Express يستخدم req.headers و res.status/next
    - Feathers hooks يستخدم params.headers و context لإرجاع البيانات أو رمي الأخطاء
3. تمرير بيانات المستخدم إلى params.user:
    - يسمح بالوصول إلى المستخدم داخل create/find/patch/remove بدون الحاجة لقراءة التوكن مرة أخرى.
4. JWT:
    - تحقق من signature باستخدام process.env.JWT_SECRET
    - يجب أن يكون التوكن صالحًا وغير منتهي الصلاحية.
5. تحسينات مقترحة:
    - دعم tokens من cookies أو query إذا رغبت في تنويع طرق المصادقة.
    - إضافة logging لأسباب الرفض لمراقبة النشاط المشبوه.
6. عند الترقية إلى Feathers 5:
    - نفس الكود يعمل، لكن hooks الآن يمكن أن تكون داخل تعريف الخدمة مباشرة.
    - يمكن دمجه مع before hooks لجميع العمليات لحماية كاملة.
*/
