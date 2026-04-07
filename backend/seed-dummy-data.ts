import mongoose from "mongoose";
import User from "./src/models/user.model";
import ProjectType from "./src/models/projectType.model";
import Employee from "./src/models/employee.model";
require("dotenv").config();

async function seedData() {
  try {
    if (!process.env.DB_URI) throw new Error("Missing DB_URI");
    await mongoose.connect(process.env.DB_URI);
    console.log("Connected to MongoDB for seeding...");

    // 1. Seed Project Types
    const pt1 = await ProjectType.create({ title: "Web Development", stages: ["Design", "Development", "Testing", "Launch"] });
    const pt2 = await ProjectType.create({ title: "Mobile App", stages: ["Prototyping", "UI/UX", "Development", "Store Submission"] });
    const pt3 = await ProjectType.create({ title: "Marketing Strategy", stages: ["Research", "Planning", "Execution"] });
    console.log("Created 3 Project Types.");

    // 2. Seed Employees
    const emp1 = await Employee.create({
      first_name: "Alice",
      last_name: "Manager",
      password: "dummy_hashed_password",
      name: "Alice Manager",
      email: "alice@xaeon.com",
      phone_number: "1234567890",
      department: "Management",
      role: "Project Manager",
    });
    console.log("Created Employee: Alice Manager");

    // 3. Seed a Client User
    const existingClient = await User.findOne({ email: "client@example.com" });
    if (!existingClient) {
      await User.create({
        email: "client@example.com",
        password: "hashed_dummy_password", // Just dummy data
        first_name: "Test",
        last_name: "Client",
        name: "Test Client",
        company: "Test Corp",
        phone_number: "0987654321",
        role: "user",
      });
      console.log("Created User: Test Client");
    }

    console.log("Seeding complete!");
  } catch (err) {
    console.error("Error seeding data:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedData();
