import { Params, Id, ServiceMethods } from '@feathersjs/feathers';
import { VideoModel, IVideo } from './video.model';
import { UserModel } from '../users/user.model';
import { Types } from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import multer from 'multer';
const upload = multer({ dest: 'uploads/' }); // الملفات المؤقتة ستُخزن هنا

export class VideoService {

    async find(params?: Params) {
        const filter = params?.query || {};  // يأخذ أي query من request
        return await VideoModel.find(filter).populate('uploader', 'name email avatar');
    }
    async get(id: Id, params?: Params) {
        if (!Types.ObjectId.isValid(id)) throw new Error('Invalid video ID');
        const video = await VideoModel.findById(id).populate('uploader', 'name email avatar');
        if (!video) throw new Error('Video not found');
        return video;
    }
    async create(data: any, params?: Params) {
        const userId = params?.user?.id;
    if (!userId) throw new Error('Unauthorized');

    // البحث عن المستخدم في DB باستخدام Google ID
    const user = await UserModel.findById(userId);
    if (!user) throw new Error('User not found');

    const filePath = data.filePath;
    if (!filePath) throw new Error('No file provided');

    const uploadResult = await cloudinary.uploader.upload(filePath, { resource_type: "video" });

    const video = await VideoModel.create({
        ...data,
        url: uploadResult.secure_url,
        uploader: user._id   // <- استخدم ObjectId من DB
    });

    fs.unlinkSync(filePath);
    return video.populate('uploader', 'name email avatar');
    }
    async remove(id: string, params?: Params) {
    const userId = params?.user?.id;  // هذا id هو _id الجديد من التوكن
    if (!userId) throw new Error('Unauthorized');
    if (!Types.ObjectId.isValid(id)) throw new Error('Invalid video ID');

    const video = await VideoModel.findById(id);
    if (!video) throw new Error('Video not found');

    const user = await UserModel.findById(userId) as any;
    if (!user) throw new Error('Unauthorized: User not found');

    if (video.uploader.toString() !== user._id.toString()) throw new Error('Forbidden');

    // 🔹 حذف الفيديو من Cloudinary
    const publicId = video.url.split('/').slice(-1)[0].replace(/\.[^/.]+$/, "");
    await cloudinary.uploader.destroy(publicId, { resource_type: "video" });

    // 🔹 حذف الفيديو من MongoDB
    await VideoModel.findByIdAndDelete(id);

    return { message: 'Video deleted', id };
    } 
    async patch(id: Id, data: any, params?: Params) {
        if (!Types.ObjectId.isValid(id)) throw new Error('Invalid video ID');
        const video = await VideoModel.findById(id);
        if (!video) throw new Error('Video not found');

        const userId = params?.user?.id;
        if (!userId) throw new Error('Unauthorized');

        const userObjId = new Types.ObjectId(userId);

        // ✅ دعم action: like / unlike
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
