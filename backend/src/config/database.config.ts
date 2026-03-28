import mongoose from "mongoose";

const db = async (retries = 5, delay = 2500): Promise<void> => {
  if (!process.env.DB_URI) {
    console.error("❌ DB_URI is not set. Create backend/.env and set DB_URI.");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.DB_URI);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error}`);

    if (retries > 0) {
      console.log(
        `🔄 Retrying in ${delay / 1000} seconds... (${retries} retries left)`
      );
      setTimeout(() => {
        db(retries - 1, delay);
      }, delay);
    } else {
      console.error(
        "❌ Could not connect to MongoDB after multiple attempts. Exiting..."
      );
      process.exit(1);
    }
  }
};

export default db;
