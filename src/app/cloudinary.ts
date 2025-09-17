import { v2 as cloudinary } from 'cloudinary';
// Import the Cloudinary SDK (version 2) and alias it as "cloudinary"
export const initializeCloudinary = () => {
// Export a function called "initializeCloudinary" that sets up Cloudinary configuration
    cloudinary.config({
// Call the config method on cloudinary to set credentials and settings
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
// Set the Cloudinary "cloud name" using an environment variable
        api_key: process.env.CLOUDINARY_API_KEY,
// Set the API key using an environment variable
        api_secret: process.env.CLOUDINARY_API_SECRET,
// Set the API secret using an environment variable (kept hidden for security)
    });
    console.log('✅ Cloudinary configured');
// Print a message to the console to confirm Cloudinary was successfully configured
};

