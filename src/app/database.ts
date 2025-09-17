import mongoose from 'mongoose';

export const initializeDatabase = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) throw new Error('MongoDB URI is not defined in environment variables');

        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB Atlas');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};
