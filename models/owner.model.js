import mongoose from "mongoose";

const ownerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    role: { type: String, enum: ["admin", "owner"], default: "owner" },
    upiId: { type: String },
    qrCode: { type: String },
    bankDetails: {
      accountNumber: { type: String },
      ifsc: { type: String },
      holderName: { type: String },
    },
    isMaintenancePaid: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Owner", ownerSchema);
