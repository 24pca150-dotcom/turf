import Turf from "../../models/turf.model.js";
import Owner from "../../models/owner.model.js";
import Review from "../../models/review.model.js";
import { sendNotification } from "../../utils/notification.service.js";

//  get all owners

export const getAllOwners = async (req, res) => {
  const admin = req.admin.role;
  if (admin !== "admin") {
    return res
      .status(403)
      .json({ success: false, message: "Unauthorized access denied" });
  }
  try {
    const owners = await Owner.find({ role: "owner" }, { password: 0 });
    res.status(200).json({
      message: " Fetched all owners",
      owners,
    });
  } catch (error) {
    console.error("Error in getAllOwners: ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// get turf by owner id
export const getTurfByOwnerId = async (req, res) => {
  const admin = req.admin.role;
  const { id } = req.params;
  if (admin !== "admin") {
    return res
      .status(403)
      .json({ success: false, message: "Unauthorized access denied" });
  }
  try {
    console.log(`Fetching turfs for owner: ${id}`);
    const turfs = await Turf.find({ owner: id }).lean();
    console.log(`Found ${turfs.length} turfs for owner ${id}`);

    const turfsWithAvgRating = await Promise.all(
      turfs.map(async (turf) => {
        const reviews = await Review.find({ turf: turf._id });
        const totalRating = reviews.reduce(
          (sum, review) => sum + review.rating,
          0
        );
        const avgRating = reviews.length > 0 ? totalRating / reviews.length : 0;
        return {
          ...turf,
          avgRating: Number(avgRating.toFixed(1)),
        };
      })
    );

    console.log("Sending owner turfs response:", turfsWithAvgRating.length);

    return res.status(200).json({
      message: " Fetched turf",
      turfs: turfsWithAvgRating,
    });
  } catch (error) {
    console.error("Error in getTurfByOwnerId: ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const toggleMaintenanceStatus = async (req, res) => {
  const admin = req.admin.role;
  const { id } = req.params;
  if (admin !== "admin") {
    return res
      .status(403)
      .json({ success: false, message: "Unauthorized access denied" });
  }
  try {
    const owner = await Owner.findById(id);
    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }

    owner.isMaintenancePaid = !owner.isMaintenancePaid;
    // If maintenance is not paid, deactivate the owner. If paid, activate.
    owner.isActive = owner.isMaintenancePaid;

    await owner.save();

    // Send Notification
    const notificationMessage = owner.isMaintenancePaid
      ? "Your maintenance charges are marked as Paid. Your account is now Active."
      : "Your maintenance charges are Pending. Your account has been Deactivated. Please pay to reactivate.";

    await sendNotification({
      recipient: owner._id,
      recipientModel: "Owner",
      title: "Maintenance Status Update",
      message: notificationMessage,
      type: "general",
    });

    return res.status(200).json({
      message: "Maintenance status updated successfully",
      owner
    });
  } catch (error) {
    console.error("Error in toggleMaintenanceStatus: ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteOwner = async (req, res) => {
  const admin = req.admin.role;
  const { id } = req.params;
  if (admin !== "admin") {
    return res
      .status(403)
      .json({ success: false, message: "Unauthorized access denied" });
  }
  try {
    const owner = await Owner.findByIdAndDelete(id);
    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }
    return res.status(200).json({ message: "Owner deleted successfully" });
  } catch (error) {
    console.error("Error in deleteOwner: ", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
