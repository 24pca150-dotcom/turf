import mongoose from "mongoose";
import Booking from "../../models/booking.model.js";
import Review from "../../models/review.model.js";
import Turf from "../../models/turf.model.js";
import User from "../../models/user.model.js";
import Owner from "../../models/owner.model.js";


export const getDashboardData = async (req, res) => {
  try {
    const ownerId = req.owner?.id;

    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized: No owner ID found" });
    }

    // Step 1: Find all turfs owned by this owner
    const turfs = await Turf.find({ owner: ownerId }).select("_id name");

    if (!turfs || turfs.length === 0) {
      return res.json({
        totalBookings: 0,
        totalReviews: 0,
        totalRevenue: 0,
        totalTurfs: 0,
        bookingsPerTurf: [],
        revenueOverTime: [],
        bookingTypeDistribution: [],
        cancelledBookings: 0,
        isMaintenancePaid: true,
      });
    }

    const turfIds = turfs.map((turf) => new mongoose.Types.ObjectId(turf._id));

    const [
      totalBookings,
      totalReviews,
      totalRevenueResult,
      bookingsPerTurf,
      revenueOverTime,
      bookingTypeDistribution,
      cancelledBookings,
    ] = await Promise.all([
      Booking.countDocuments({ turf: { $in: turfIds } }),
      Review.countDocuments({ turf: { $in: turfIds } }),
      Booking.aggregate([
        { $match: { turf: { $in: turfIds } } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),
      Booking.aggregate([
        { $match: { turf: { $in: turfIds } } },
        { $group: { _id: "$turf", count: { $sum: 1 } } },
        {
          $lookup: {
            from: "turves",
            localField: "_id",
            foreignField: "_id",
            as: "turfInfo",
          },
        },
        // { $unwind: "$turfInfo" },
        { $project: { name: { $ifNull: [{ $arrayElemAt: ["$turfInfo.name", 0] }, "Unknown Turf"] }, bookings: "$count" } },
      ]),
      Booking.aggregate([
        { $match: { turf: { $in: turfIds } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: { $toDate: { $ifNull: ["$createdAt", new Date()] } } } },
            revenue: { $sum: "$totalPrice" },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 30 },
      ]),
      Booking.aggregate([
        { $match: { turf: { $in: turfIds } } },
        { $group: { _id: "$type", count: { $sum: 1 } } }
      ]),
      Booking.countDocuments({ turf: { $in: turfIds }, status: "cancelled" })
    ]);

    const ownerDetails = await Owner.findById(ownerId).select("isMaintenancePaid");

    res.json({
      totalBookings,
      totalReviews,
      totalRevenue: totalRevenueResult[0]?.total || 0,
      totalTurfs: turfs.length,
      bookingsPerTurf: bookingsPerTurf || [],
      revenueOverTime: revenueOverTime || [],
      bookingTypeDistribution: (bookingTypeDistribution || []).map(item => ({
        name: item._id === 'booking' ? 'Regular' : 'Tournament',
        value: item.count
      })),
      cancelledBookings,
      isMaintenancePaid: ownerDetails ? ownerDetails.isMaintenancePaid : true,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res
      .status(500)
      .json({ message: "Error fetching dashboard data", error: error.message });
  }
};