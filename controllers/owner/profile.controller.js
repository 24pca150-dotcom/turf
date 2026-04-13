
import Owner from "../../models/owner.model.js";
import Booking from "../../models/booking.model.js";

export const updateOwnerProfile = async (req, res) => {
    try {
        const ownerId = req.owner.id;
        const { upiId, qrCode } = req.body;

        const updatedOwner = await Owner.findByIdAndUpdate(
            ownerId,
            { upiId, qrCode },
            { new: true }
        ).select("-password");

        if (!updatedOwner) {
            return res.status(404).json({ message: "Owner not found" });
        }

        res.status(200).json({ message: "Profile updated successfully", owner: updatedOwner });
    } catch (error) {
        res.status(500).json({ message: "Error updating profile", error: error.message });
    }
};

export const getOwnerProfile = async (req, res) => {
    try {
        const ownerId = req.owner.id;
        const owner = await Owner.findById(ownerId).select("-password");

        if (!owner) {
            return res.status(404).json({ message: "Owner not found" });
        }

        res.status(200).json(owner);
    } catch (error) {
        res.status(500).json({ message: "Error fetching profile", error: error.message });
    }
};

export const verifyBookingPayment = async (req, res) => {
    try {
        const ownerId = req.owner.id;
        const { bookingId } = req.params;
        const { status } = req.body; // 'verified' or 'failed'

        const booking = await Booking.findById(bookingId).populate('turf');
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // Verify the booking belongs to a turf owned by this owner
        if (booking.turf.owner.toString() !== ownerId) {
            return res.status(403).json({ message: "Not authorized to verify this booking" });
        }

        booking.paymentStatus = status;
        await booking.save();

        res.status(200).json({ message: `Booking payment marked as ${status}`, booking });

    } catch (error) {
        res.status(500).json({ message: "Error verifying payment", error: error.message });
    }
};
