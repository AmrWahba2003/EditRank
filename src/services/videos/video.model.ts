import { Schema, model, Document, Types } from 'mongoose';

export interface IVideo extends Document {
    title: string;
    description?: string;
    category: string;
    subcategory: string;
    url: string;          // رابط الفيديو في Cloudinary
    thumbnail?: string;   // رابط الصورة المصغرة
    likes: number;
    uploader: Types.ObjectId;
    createdAt: Date;
    likedBy: Types.ObjectId[]; 
}

const videoSchema = new Schema<IVideo>({
    title: { type: String, required: true },
    description: { type: String },
    category: { type: String, required: true },
    subcategory: { type: String, required: true },
    url: { type: String, required: true },
    thumbnail: { type: String },
    uploader: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
    likedBy: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }]

},
{ 
    timestamps: true, 
    toJSON: { virtuals: true }, 
    toObject: { virtuals: true } 
});
// 🟢 احذف الـ index الخطأ مرة واحدة

// 🟢 Virtual field لحساب عدد الإعجابات
videoSchema.virtual('likes').get(function () {
    return this.likedBy.length;
});
export const VideoModel = model<IVideo>('Video', videoSchema);

// (async () => {
//     try {
//         const indexes = await VideoModel.collection.indexes();
//         const indexExists = indexes.some(idx => idx.name === 'likedBy_1');

//         if (indexExists) {
//             await VideoModel.collection.dropIndex('likedBy_1');
//             console.log('✅ Index likedBy_1 deleted successfully');
//         } else {
//             console.log('⚠️ Index likedBy_1 not found, skipping...');
//         }
//     } catch (err) {
//         console.error('❌ Error dropping index:', err);
//     }
// })();