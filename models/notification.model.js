import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'recipientModel',
        },
        recipientModel: {
            type: String,
            required: true,
            enum: ['User', 'Owner'],
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'senderModel',
        },
        senderModel: {
            type: String,
            enum: ['User', 'Owner'],
        },
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ['booking', 'cancellation', 'reminder', 'reschedule', 'general'],
            default: 'general',
        },
        bookingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Booking',
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
