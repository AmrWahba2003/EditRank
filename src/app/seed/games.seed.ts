// src/seed/games.seed.ts
import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { CategoryModel } from "../../services/categories/category.model";

// اجعل المسار صريحًا لملف .env
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// تحقق أن المتغير تم تحميله
if (!process.env.MONGO_URI) {
  throw new Error(".env not loaded correctly or MONGO_URI is missing!");
}

console.log("✅ Using MONGO_URI from .env");

const gamesCategory = {
  name: "Games",
  subcategories: [
    "GTA V",
    "FIFA 23",
    "Call of Duty",
    "Minecraft",
    "League of Legends",
    "PUBG",
    "Fortnite",
    "The Witcher 3",
    "Red Dead Redemption 2",
    "Elden Ring"
  ]
};

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log("✅ Connected to MongoDB");

    await CategoryModel.deleteMany({ name: "Games" });
    console.log("🗑️ Old 'Games' category removed");

    await CategoryModel.create(gamesCategory);
    console.log("🎮 Games category seeded successfully");

    await mongoose.disconnect();
  } catch (err) {
    console.error("❌ Error seeding games:", err);
  }
}

seed();
