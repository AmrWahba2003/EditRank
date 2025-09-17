import { HookContext } from '@feathersjs/feathers';
import jwt from 'jsonwebtoken';

export const verifyJWT = async (context: HookContext) => {
    const { params } = context;

    // ✅ التغيير 1: استخدام params.headers بدل req.headers
    const authHeader = params.headers?.authorization;
    if (!authHeader) {
        // ✅ التغيير 2: رمي خطأ بدل استخدام res.status
        throw new Error('Unauthorized: No Authorization header');
    }

    const token = authHeader.split(' ')[1]; // Bearer <token>

    try {
        const payload: any = jwt.verify(token, process.env.JWT_SECRET!);
    
        // ✅ التغيير 3: إضافة بيانات المستخدم إلى params.user بدل req.user
        params.user = { id: payload.id, email: payload.email };

        return context; // ✅ التغيير 4: Hook يجب أن يرجع context
    } catch (err) {
        // ✅ التغيير 5: رمي خطأ في حالة فشل التحقق
        throw new Error('Unauthorized: Invalid token');
    }
};