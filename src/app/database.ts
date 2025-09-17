import mongoose from 'mongoose';

export const initializeDatabase = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://WhosNext:MyNewPass2025@cluster0.80rawvw.mongodb.net/ER-final?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB Atlas');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

