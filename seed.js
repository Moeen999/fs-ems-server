import "dotenv/config";
import connectDB from "./configs/db.js";
import User from "./models/User.js";
import bcrypt from "bcrypt";

const TemporaryPassword = "ADMIN123";

async function registerAdmin() {
  try {
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    if (!ADMIN_EMAIL) {
      console.error("ADMIN_EMAIL is not defined in .env file");
      process.exit(1);
    }

    await connectDB();
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
    if (existingAdmin) {
      console.log("Admin user already exists");
      process.exit(0);
    }
    const hashedPassword = await bcrypt.hash(TemporaryPassword, 10);
    const adminUser = await User.create({
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: "ADMIN",
    });
    console.log("Admin user created successfully");
    console.log(`Email: ${ADMIN_EMAIL}`);
    console.log(`Temporary Password: ${TemporaryPassword}`);
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }
}

registerAdmin();
