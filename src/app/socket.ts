// ---------------------------- Imports ----------------------------

// استيراد Server من socket.io لإنشاء WebSocket server
import { Server } from 'socket.io';

// استيراد نوع Socket لتحديد نوع المتغيرات في TypeScript
import type { Socket } from 'socket.io';

// استيراد Application من Feathers-Express
// app.service(...) للوصول إلى خدمات Feathers
import { Application } from '@feathersjs/express';

// استيراد jwt للتحقق من التوكنات
import jwt from 'jsonwebtoken';

// ---------------------------- setupSocket ----------------------------

export const setupSocket = (server: any, app: Application) => {
    // إنشاء Socket.IO server مرتبط بالسيرفر الموجود
    // CORS: السماح لجميع المصادر والطرق GET و POST
    const io = new Server(server, {
        cors: { origin: '*', methods: ['GET','POST'] }
    });

    // -------------------- Middleware للتحقق من JWT --------------------
    // io.use: كل socket يجب أن يمر من هنا قبل الاتصال
    io.use((socket: Socket, next: (err?: Error) => void) => {
        try {
            // جلب التوكن من handshake (auth أو query)
            const raw = socket.handshake.auth?.token || socket.handshake.query?.token;
            if (!raw) return next(new Error('Unauthorized'));

            // إزالة كلمة "Bearer " إذا موجودة
            const token = (typeof raw === 'string') ? raw.replace(/^Bearer\s+/, '') : '';

            // التحقق من صحة JWT
            const payload: any = jwt.verify(token, process.env.JWT_SECRET!);

            // تمرير بيانات المستخدم إلى socket.data.user
            socket.data.user = { id: payload.id, email: payload.email };
            return next();
        } catch (err) {
            return next(new Error('Unauthorized'));
        }
    });

    // -------------------- Connection Event --------------------
    io.on('connection', (socket: Socket) => {
        // جلب بيانات المستخدم بعد التحقق من JWT
        const user = socket.data.user as { id: string; email: string };

        // انضمام المستخدم لغرفة خاصة به لتلقي الرسائل الخاصة
        socket.join(`user_${user.id}`);
        console.log('✅ Socket connected:', user.id);

        // الحصول على خدمة الرسائل من Feathers
        const messageSvc: any = app.service('messages');

        // -------------------- إرسال رسالة خاصة --------------------
        socket.on('private_message', async (payload: { to: string; content: string }, ack?: (res: any) => void) => {
            try {
                // إنشاء الرسالة في DB باستخدام خدمة Feathers
                const saved = await messageSvc.create(
                    { to: payload.to, content: payload.content },
                    { user: { id: user.id } } // تمرير المستخدم الحالي
                );

                // إرسال الرسالة للمستلم
                io.to(`user_${payload.to}`).emit('message', saved);

                // إرسال تأكيد للمُرسل
                socket.emit('message_sent', saved);

                // إذا كانت دالة ack موجودة، إرسال نتيجة العملية
                if (ack) ack({ success: true, message: saved });
            } catch (err: any) {
                if (ack) ack({ success: false, error: err.message });
            }
        });

        // -------------------- Disconnect Event --------------------
        socket.on('disconnect', (reason: string) => {
            console.log('❌ Socket disconnected:', user.id, reason);
        });
    });

    return io;
};

// ---------------------------- ملاحظات أمان وأداء ----------------------------

/*
1. Middleware JWT:
    - يمنع أي اتصال بدون توكن صالح.
    - token يمكن أن يأتي من handshake.auth.token أو handshake.query.token.
    - إزالة "Bearer " إذا كان موجود.

2. Rooms:
    - كل مستخدم ينضم لغرفة خاصة باسم user_{id} لتسهيل الرسائل الخاصة.

3. private_message event:
    - يتم حفظ الرسالة في DB أولاً ثم إرسالها مباشرة إلى المستلم.
    - ack: callback اختياري لإرجاع حالة العملية للمرسل.

4. disconnect event:
    - يسجل سبب قطع الاتصال لأغراض المراقبة.

5. تحسينات مقترحة:
    - التحقق من طول محتوى الرسالة قبل إرسالها.
    - إضافة rate-limiting لكل socket لمنع الرسائل المفرطة.
    - دعم broadcast للمجموعات/القنوات المستقبلية.
    - يمكن استخدام namespaces لتقسيم أنواع الأحداث المختلفة.

6. Feathers 5:
    - يمكن استخدام hooks مع Socket.IO لحماية الخدمات.
    - يمكن استخدام socket.data.user بدلاً من params.user لكل خدمة في الوقت الفعلي.

7. الأداء:
    - انضمام كل مستخدم لغرفة منفصلة يقلل الحمل عند إرسال الرسائل.
    - populate يمكن إضافته في خدمة الرسائل قبل الإرسال.
*/
