import Booking from "../../models/booking.model.js";
import Turf from "../../models/turf.model.js";
import { sendNotification } from "../../utils/notification.service.js";

export const getOwnerBookings = async (req, res) => {
  try {
    const ownerId = req.owner.id;

    // Find turfs owned by this owner
    const ownedTurfs = await Turf.find({ owner: ownerId }).select("_id");
    console.log(ownedTurfs.length, "ownedTurfs");

    if (ownedTurfs.length === 0) {
      console.log("No bookings found for this owner's turfs");
      return res.status(404).json({ message: "No turfs found for this owner" });
    }

    const turfIds = ownedTurfs.map((turf) => turf._id);

    const bookings = await Booking.aggregate([
      {
        $match: {
          turf: { $in: turfIds },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $lookup: {
          from: "turves",
          localField: "turf",
          foreignField: "_id",
          as: "turf",
        },
      },
      {
        $lookup: {
          from: "timeslots",
          localField: "timeSlot",
          foreignField: "_id",
          as: "timeSlot",
        },
      },
      { $unwind: "$user" },
      { $unwind: "$turf" },
      { $unwind: "$timeSlot" },
      {
        $project: {
          id: "$_id",
          turfName: "$turf.name",
          userName: "$user.name",
          totalPrice: 1,
          bookingDate: "$createdAt",
          duration: {
            $divide: [
              { $subtract: ["$timeSlot.endTime", "$timeSlot.startTime"] },
              1000 * 60 * 60, // Convert milliseconds to hours
            ],
          },
          startTime: "$timeSlot.startTime",
          endTime: "$timeSlot.endTime",
          transactionId: 1,
          paymentStatus: 1,
          status: 1,
          refundAmount: 1,
          refundDetails: 1,
          cancellationReason: 1,
          userPhone: "$user.phone",
        },
      },
      { $sort: { bookingDate: -1 } },
    ]);

    if (bookings.length === 0) {
      return res
        .status(404)
        .json({ message: "No bookings found for this owner's turfs" });
    }

    return res.status(200).json(bookings);
  } catch (error) {
    console.error("Error in getOwnerBookings:", error);
    res
      .status(500)
      .json({ message: "Error fetching bookings", error: error.message });
  }
};

export const verifyBooking = async (req, res) => {
  const { bookingId } = req.body;
  const ownerId = req.owner.id;

  try {
    const booking = await Booking.findById(bookingId).populate("turf");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.turf.owner.toString() !== ownerId) {
      return res.status(403).json({ message: "Unauthorized action" });
    }

    booking.paymentStatus = "verified";
    booking.status = "confirmed";
    await booking.save();

    // Notify User
    await sendNotification({
      recipient: booking.user,
      recipientModel: 'User',
      sender: ownerId,
      senderModel: 'Owner',
      title: 'Payment Verified',
      message: `Your payment for ${booking.turf.name} has been verified. Booking is now confirmed.`,
      type: 'booking',
      bookingId: booking._id
    });

    return res.status(200).json({ success: true, message: "Booking verified successfully" });
  } catch (error) {
    console.error("Error verifying booking:", error);
    return res.status(500).json({ message: "Error verifying booking" });
  }
};

export const processRefund = async (req, res) => {
  const { bookingId } = req.body;
  const ownerId = req.owner.id;

  try {
    const booking = await Booking.findById(bookingId).populate("turf");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.turf.owner.toString() !== ownerId) {
      return res.status(403).json({ message: "Unauthorized action" });
    }

    if (booking.status !== "refund_pending") {
      return res.status(400).json({ message: "Booking is not pending refund" });
    }

    booking.status = "refunded";
    await booking.save();

    // Notify User
    await sendNotification({
      recipient: booking.user,
      recipientModel: 'User',
      sender: ownerId,
      senderModel: 'Owner',
      title: 'Refund Processed',
      message: `Your refund for the booking at ${booking.turf.name} has been processed.`,
      type: 'cancellation',
      bookingId: booking._id
    });

    return res.status(200).json({ success: true, message: "Refund marked as processed" });
  } catch (error) {
    console.error("Error processing refund:", error);
    return res.status(500).json({ message: "Error processing refund" });
  }
};
