import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    turf: { type: mongoose.Schema.Types.ObjectId, ref: "Turf" },
    timeSlot: { type: mongoose.Schema.Types.ObjectId, ref: "TimeSlot" },
    totalPrice: { type: Number, required: true },
    qrCode: { type: String, required: true },
    transactionId: { type: String, required: true },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    paymentStatus: {
      type: String,
      enum: ["pending", "verified", "failed"],
      default: "pending",
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "refund_pending", "refunded"],
      default: "pending",
    },
    refundAmount: { type: Number, default: 0 },
    cancellationFee: { type: Number, default: 0 },
    cancelledAt: { type: Date },
    cancellationReason: { type: String },
    refundDetails: {
      accountHolderName: { type: String },
      bankName: { type: String },
      accountNumber: { type: String },
      ifscCode: { type: String },
      upiId: { type: String },
    },
    type: {
      type: String,
      enum: ["booking", "tournament"],
      default: "booking",
    },
    teamDetails: {
      name: { type: String },
      members: [{ type: String }],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);
