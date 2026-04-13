import adjustTime from "../../utils/adjustTime.js";

import mongoose from "mongoose";
import crypto from "crypto";
import Booking from "../../models/booking.model.js";
import TimeSlot from "../../models/timeSlot.model.js";
import generateQRCode from "../../utils/generateQRCode.js";
import Turf from "../../models/turf.model.js";
import generateEmail, {
  generateHTMLContent,
} from "../../utils/generateEmail.js";
import User from "../../models/user.model.js";
import { format, parseISO } from "date-fns";
import { sendNotification } from "../../utils/notification.service.js";
import Owner from "../../models/owner.model.js";

// createOrder removed as Razorpay is no longer used

import Razorpay from "razorpay";

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createOrder = async (req, res) => {
  const { amount } = req.body;

  try {
    const options = {
      amount: amount * 100, // amount in smallest currency unit (paise)
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      order,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong while creating order",
    });
  }
};

export const createBooking = async (req, res) => {
  const userId = req.user.user;

  const {
    id: turfId,
    duration,
    startTime,
    endTime,
    selectedTurfDate,
    totalPrice,
    transactionId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    type = 'booking',
    teamDetails,
  } = req.body;

  try {
    // 1. Verify Payment Signature
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpayOrderId + "|" + razorpayPaymentId)
      .digest("hex");

    if (generated_signature !== razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed. Invalid signature.",
      });
    }

    const formattedStartTime = format(parseISO(startTime), "hh:mm a");
    const formattedEndTime = format(parseISO(endTime), "hh:mm a");
    const formattedDate = format(parseISO(selectedTurfDate), "d MMM yyyy");

    console.log("Creating booking with Transaction ID:", transactionId);

    // This time is storing in DB for the time slot that is created
    const adjustedStartTime = adjustTime(startTime, selectedTurfDate);
    const adjustedEndTime = adjustTime(endTime, selectedTurfDate);

    const [user, turf] = await Promise.all([
      User.findById(userId),
      Turf.findById(turfId),
    ]);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (!turf) {
      return res
        .status(404)
        .json({ success: false, message: "Turf not found" });
    }

    // Check for double booking
    const existingSlot = await TimeSlot.findOne({
      turf: turfId,
      startTime: adjustedStartTime,
      status: { $ne: "cancelled" },
    });

    if (existingSlot) {
      return res.status(409).json({
        success: false,
        message: "This slot has already been booked. Please choose another.",
      });
    }

    // Generate a unique ID for the booking first to include it in the QR code
    const bookingId = new mongoose.Types.ObjectId();

    //  generate QR code
    const QRcode = await generateQRCode(
      bookingId,
      formattedStartTime,
      formattedEndTime,
      formattedDate,
      turf.name,
      turf.location
    );

    // Create time slot and booking
    const [timeSlot, booking] = await Promise.all([
      TimeSlot.create({
        turf: turfId,
        startTime: adjustedStartTime,
        endTime: adjustedEndTime,
      }),
      Booking.create({
        _id: bookingId,
        user: userId,
        turf: turfId,
        timeSlot: null, // Will be updated after TimeSlot is created
        totalPrice,
        qrCode: QRcode,
        transactionId, // Keep for reference, or use rzp payment id
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        paymentStatus: "verified", // Payment is verified
        status: "pending",
        type,
        teamDetails: type === 'tournament' ? teamDetails : undefined,
      }),
    ]);

    // Update the booking with time slot
    booking.timeSlot = timeSlot._id;

    await Promise.all([
      booking.save(),
      User.findByIdAndUpdate(userId, { $push: { bookings: booking._id } }),
    ]);

    // Generate and send email
    const htmlContent = generateHTMLContent(
      turf.name,
      turf.location,
      formattedDate,
      formattedStartTime,
      formattedEndTime,
      totalPrice,
      QRcode
    );

    await generateEmail(user.email, "Booking Confirmation", htmlContent);

    // Notify Owner
    if (turf.owner) {
      await sendNotification({
        recipient: turf.owner,
        recipientModel: 'Owner',
        sender: userId,
        senderModel: 'User',
        title: 'New Booking Request',
        message: `${user.name} has requested a booking for ${turf.name} on ${formattedDate}.`,
        type: 'booking',
        bookingId: booking._id
      });
    }

    return res.status(200).json({
      success: true,
      message: "Booking requested successfully. Payment verified.",
    });
  } catch (error) {
    console.error("Error in createBooking", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing your booking",
    });
  }
};

// get bookings for a user
export const getBookings = async (req, res) => {
  try {
    console.log("getBookings Authorization header:", req.headers?.authorization);
    console.log("getBookings req.user:", req.user);
    if (!req.user || !req.user.user) {
      console.error("User ID not found in request object:", req.user);
      return res.status(401).json({ message: "Unauthorized: User not identified" });
    }
    const userId = req.user.user;

    const bookings = await Booking.find({ user: userId })
      .sort({ createdAt: -1 })
      .select("qrCode totalPrice paymentStatus transactionId turf timeSlot status refundAmount refundDetails cancellationReason createdAt")
      .populate("timeSlot", "startTime endTime date")
      .populate("turf", "name location cancellationWindowHours");
    // console.log(bookings, "bookings");
    return res.status(200).json(bookings);
  } catch (error) {
    console.error("Error in getBookings:", error); // Use console.error for better visibility
    return res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

export const cancelBooking = async (req, res) => {
  const { bookingId, refundDetails = {} } = req.body;
  const userId = req.user.user;

  try {
    const booking = await Booking.findById(bookingId).populate("turf timeSlot");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.user.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized action" });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ message: "Booking is already cancelled" });
    }

    const { turf, timeSlot } = booking;
    const currentTime = new Date();
    const bookingTime = new Date(booking.createdAt);
    const diffInMilliseconds = currentTime - bookingTime;
    const diffInHours = diffInMilliseconds / (1000 * 60 * 60);

    if (diffInHours > 4) {
      return res.status(400).json({
        message: "Cancellation is only allowed within 4 hours of booking.",
      });
    }

    // Calculate refund
    const refundAmount = booking.totalPrice * 0.9;
    const cancellationFee = booking.totalPrice * 0.1;

    // Update Booking
    booking.status = "refund_pending";
    const { reason, ...restRefundDetails } = refundDetails;
    booking.refundDetails = restRefundDetails;
    booking.cancellationReason = reason;

    booking.refundAmount = refundAmount;
    booking.cancellationFee = cancellationFee;
    booking.cancelledAt = currentTime;

    await booking.save();

    // Notify Owner
    if (turf.owner) {
      await sendNotification({
        recipient: turf.owner,
        recipientModel: 'Owner',
        sender: userId,
        senderModel: 'User',
        title: 'Booking Cancelled',
        message: `${booking.user?.name || 'A user'} has cancelled their booking for ${turf.name}. Refund requested.`,
        type: 'cancellation',
        bookingId: booking._id
      });
    }

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully. Refund initiated.",
      refundAmount,
    });
  } catch (error) {
    console.error("Error in cancelBooking", error);
    return res.status(500).json({ message: "Error cancelling booking" });
  }
};
