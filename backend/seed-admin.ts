import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./src/models/user.model";
require("dotenv").config();

async function seedAdmin() {
  try {
    if (!process.env.DB_URI) throw new Error("Missing DB_URI");
    await mongoose.connect(process.env.DB_URI);
    console.log("Connected to MongoDB...");

    // Feel free to change these credentials
    const email = "admin@xaeon.com";
    const password = "adminpassword123";
    const hashedPassword = await bcrypt.hash(password, 12);

    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.log(`Admin user ${email} already exists.`);
      existingAdmin.role = "admin";
      await existingAdmin.save();
      console.log("Ensured role is admin.");
    } else {
      await User.create({
        email,
        password: hashedPassword,
        first_name: "Super",
        last_name: "Admin",
        name: "Super Admin",
        company: "Xaeon",
        phone_number: "0000000000",
        role: "admin",
      });
      console.log(`Created admin user! Email: ${email} | Password: ${password}`);
    }

  } catch (err) {
    console.error("Error seeding admin:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedAdmin();
