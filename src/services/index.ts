import dotenv from 'dotenv';
import http from 'http';
import { initializeApp } from '../app';
import { initializeDatabase } from '../app/database';
import { initializeCloudinary } from '../app/cloudinary';

dotenv.config();

const startServer = async () => {
  await initializeDatabase();
  initializeCloudinary();

  const app = await initializeApp();
  const port = process.env.PORT || 3030;

  const server = http.createServer(app);
  server.listen(port, () => {
    console.log(`🚀 Feathers server running on http://localhost:${port}`);
  });
  
};

startServer();
