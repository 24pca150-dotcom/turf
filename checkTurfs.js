
import mongoose from "mongoose";
import dotenv from "dotenv";
import Turf from "./models/turf.model.js";
import Owner from "./models/owner.model.js";

dotenv.config();

const checkTurfs = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const owners = await Owner.find();
        console.log(`Found ${owners.length} owners.`);

        for (const owner of owners) {
            console.log(`Owner: ${owner.name} (${owner._id}) - Role: ${owner.role}`);
            const turfs = await Turf.find({ owner: owner._id });
            console.log(`  - Has ${turfs.length} turfs.`);
            turfs.forEach(t => console.log(`    - ${t.name} (${t._id})`));
        }

        const allTurfs = await Turf.find();
        console.log(`Total Turfs in DB: ${allTurfs.length}`);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

checkTurfs();
