
import mongoose from "mongoose";
import dotenv from "dotenv";
import Owner from "./models/owner.model.js";

dotenv.config();

const findAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const admin = await Owner.findOne({ role: "admin" });

    if (admin) {
      console.log("Admin found:");
      console.log("Email:", admin.email);
      console.log("Name:", admin.name);
      console.log("Phone:", admin.phone);
    } else {
      console.log("No admin found.");
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
};

findAdmin();
