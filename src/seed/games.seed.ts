import mongoose from "mongoose";
import { CategoryModel } from "../services/categories/category.model";
import dotenv from "dotenv";
dotenv.config();

const categories = [
  {
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
  },
  {
    name: "Movies",
    subcategories: [
      "The Batman",
      "Spider-Man: No Way Home",
      "Avatar: The Way of Water",
      "Inception",
      "The Matrix Resurrections",
      "Interstellar",
      "Doctor Strange",
      "Thor: Love and Thunder",
      "Top Gun: Maverick",
      "The Flash"
    ]
  },
  {
    name: "Series",
    subcategories: [
      "Stranger Things",
      "The Mandalorian",
      "The Witcher",
      "House of the Dragon",
      "Breaking Bad",
      "Better Call Saul",
      "Game of Thrones",
      "Squid Game",
      "Money Heist",
      "The Boys"
    ]
  },
  {
    name: "Anime",
    subcategories: [
      "Attack on Titan",
      "Demon Slayer",
      "My Hero Academia",
      "One Piece",
      "Jujutsu Kaisen",
      "Naruto",
      "Death Note",
      "Dragon Ball Super",
      "Tokyo Revengers",
      "Fullmetal Alchemist"
    ]
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log("✅ Connected to MongoDB");

    for (const category of categories) {
      await CategoryModel.deleteMany({ name: category.name });
      console.log(`🗑️ Old '${category.name}' category removed`);

      await CategoryModel.create(category);
      console.log(`🎯 '${category.name}' category seeded successfully`);
    }

    await mongoose.disconnect();
    console.log("✅ Seeding complete!");
  } catch (err) {
    console.error("❌ Error seeding categories:", err);
  }
}

seed();
