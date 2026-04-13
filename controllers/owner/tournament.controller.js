import Booking from "../../models/booking.model.js";
import Turf from "../../models/turf.model.js";
import { sendNotification } from "../../utils/notification.service.js";

export const getTournamentRegistrations = async (req, res) => {
    const ownerId = req.owner.id;

    try {
        // Find turfs owned by this owner
        const turfs = await Turf.find({ owner: ownerId }).select("_id");
        const turfIds = turfs.map((t) => t._id);

        const registrations = await Booking.find({
            turf: { $in: turfIds },
            type: "tournament",
        })
            .populate("user", "name email phone")
            .populate("turf", "name")
            .sort({ createdAt: -1 });

        res.status(200).json(registrations);
    } catch (error) {
        console.error("Error fetching tournament registrations:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const updateRegistrationStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'confirmed' or 'cancelled' (rejected)

    try {
        const booking = await Booking.findById(id).populate("user");
        if (!booking) {
            return res.status(404).json({ message: "Registration not found" });
        }

        booking.status = status;
        await booking.save();

        // Notify User
        const message =
            status === "confirmed"
                ? `Your tournament registration for ${booking.teamDetails?.name} has been Accepted!`
                : `Your tournament registration for ${booking.teamDetails?.name} has been Rejected.`;

        await sendNotification({
            recipient: booking.user._id,
            recipientModel: "User",
            title: "Tournament Registration Update",
            message,
            type: "general",
        });

        res.status(200).json({ message: "Status updated successfully", booking });
    } catch (error) {
        console.error("Error updating registration status:", error);
        res.status(500).json({ message: "Server error" });
    }
};
