
import mongoose from "mongoose";
import dotenv from "dotenv";
import * as argon2 from "argon2";
import Owner from "./models/owner.model.js";

dotenv.config();

const createAdmin = async () => {
    try {
        console.log("DB CONNECTING TO:", process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const existingAdmin = await Owner.findOne({ email: "admin@gmail.com" });
        if (existingAdmin) {
            console.log("Admin account already exists.");
            return;
        }

        const hashedPassword = await argon2.hash("admin123");

        const newAdmin = new Owner({
            name: "Admin",
            email: "admin@gmail.com",
            password: hashedPassword,
            phone: "0000000000",
            role: "admin",
            upiId: "admin@upi",
            qrCode: "admin_qr",
        });

        await newAdmin.save();
        console.log("Admin account created successfully!");
        console.log("Email: admin@gmail.com");
        console.log("Password: admin123");
    } catch (err) {
        console.error("Error creating admin:", err);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

createAdmin();
