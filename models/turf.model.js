import mongoose from "mongoose";

const turfSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    image: { type: String, required: true },
    sportTypes: [{ type: String, required: true }],
    pricePerHour: { type: Number, required: true },
    openTime: { type: String, required: true },
    closeTime: { type: String, required: true },
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      required: true,
    },
    cancellationWindowHours: { type: Number, default: 24 },
    tournamentConfig: {
      isActive: { type: Boolean, default: false },
      sport: { type: String },
      teamSize: { type: Number, default: 11 },
    },
    amenities: [{ type: String }],
    peakPrice: { type: Number },
    peakHours: [{ type: String }],
  },
  { timestamps: true }
);

const Turf = mongoose.model("Turf", turfSchema);

export default Turf;
