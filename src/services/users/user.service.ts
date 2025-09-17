import { Params, Id, ServiceMethods } from '@feathersjs/feathers';
import { UserModel, IUser } from './user.model';
import { VideoModel } from '../videos/video.model';
import { Types } from 'mongoose';
import { verifyJWT } from '../../app/jwt.middleware';
import jwt from 'jsonwebtoken';
export class UserServices {
    async find(params?: Params) {
        return await UserModel.find();
    }

    async get(id: Id, params?: Params) {
        if (!Types.ObjectId.isValid(id)) throw new Error('Invalid user ID');
        const user = await UserModel.findById(id);
        if (!user) throw new Error('User not found');
        const videos = await VideoModel.find({ uploader: id }); // بدون populate
        return { ...user.toObject(), videos };
    }

    async search(query: string) {
    return await UserModel.find({
        $or: [
            { name: { $regex: query, $options: 'i' } },
            { username: { $regex: query, $options: 'i' } }
        ] 
        }).select('name username avatar');
    }
}

// 🛡️ إضافة hook مباشرة عند التسجيل في app.ts
