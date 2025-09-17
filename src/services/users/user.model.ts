import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
    googleId: string;
    name: string;
    email: string;
    avatar?: string;
    username: string;
}

const userSchema = new Schema<IUser>({
    googleId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    avatar: { type: String },
    username: { type: String, required: true, unique: true },
});

export const UserModel = model<IUser>('User', userSchema);
