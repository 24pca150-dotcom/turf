import chalk from "chalk";
import Booking from "../../models/booking.model.js";

// Get all refund requests
export const getRefundRequests = async (req, res) => {
    try {
        const refunds = await Booking.find({ status: "refund_pending" })
            .populate("user", "name email bankDetails")
            .populate("turf", "name")
            .sort({ cancelledAt: -1 });

        return res.status(200).json({ success: true, refunds });
    } catch (error) {
        console.log(chalk.red("Error in getRefundRequests"), error);
        return res.status(500).json({ message: error.message });
    }
};

// Process refund (Mark as refunded)
export const processRefund = async (req, res) => {
    const { bookingId } = req.body;

    try {
        // Check if bookingId is valid
        if (!bookingId) {
            return res.status(400).json({ message: "Booking ID is required" });
        }

        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.status !== "refund_pending") {
            return res.status(400).json({ message: "Booking is not pending refund" });
        }

        booking.status = "refunded";
        await booking.save();

        return res
            .status(200)
            .json({ success: true, message: "Refund marked as completed" });
    } catch (error) {
        console.log(chalk.red("Error in processRefund"), error);
        return res.status(500).json({ message: error.message });
    }
};
