import chalk from "chalk";
import Turf from "../../models/turf.model.js";
import TimeSlot from "../../models/timeSlot.model.js";
import { format, parseISO, startOfDay } from "date-fns";

// get all turfs
export const getAllTurfs = async (req, res) => {
  try {
    const turfs = await Turf.find({}).populate("owner");
    const activeTurfs = turfs.filter(turf => turf.owner && turf.owner.isActive);
    return res.status(200).json({ turfs: activeTurfs });
  } catch (err) {
    console.log(chalk.red("Error in getAllTurfs"), err);
    return res.status(500).json({ message: err.message });
  }
};

// get single turf by id

export const getTurfById = async (req, res) => {
  const { id } = req.params;
  try {
    const turf = await Turf.findById(id).populate("owner");
    if (!turf) {
      return res.status(404).json({ message: "Turf not found" });
    }
    if (turf.owner && !turf.owner.isActive) {
      return res.status(403).json({ message: "This turf is currently unavailable." });
    }
    return res.status(200).json({ turf });
  } catch (error) {
    console.log(chalk.red("Error in getTurfById"), error);
    return res.status(500).json({ message: error.message });
  }
};

// get time slots by turf id

export const getTimeSlotByTurfId = async (req, res) => {
  const { date, turfId } = req.query;

  const selectedDate = new Date(date);
  const startOfSelectedDate = startOfDay(selectedDate);
  const endOfSelectedDate = new Date(startOfSelectedDate);
  endOfSelectedDate.setDate(endOfSelectedDate.getDate() + 1);

  const query = {
    turf: turfId,
    startTime: { $gte: startOfSelectedDate },
    endTime: { $lt: endOfSelectedDate },
    status: { $ne: "cancelled" }, // Exclude cancelled slots
  };

  try {
    // get all time slot when there is no turfid  in Timeslot db
    const bookedTime = await TimeSlot.find(query);

    const turf = await Turf.findById(turfId).populate("owner");

    console.log("---------------- DEBUG START ----------------");
    console.log("Original Request turfId:", turfId);
    console.log("Found Turf Name:", turf?.name);
    console.log("Found Turf Owner ID:", turf?.owner?._id);
    console.log("Found Turf Owner Object Keys:", Object.keys(turf?.owner?.toObject() || {}));
    console.log("Found Turf Owner QR Code (Raw):", turf?.owner?.qrCode);
    console.log("---------------- DEBUG END ----------------");

    const timeSlots = {
      openTime: turf.openTime,
      closeTime: turf.closeTime,
      pricePerHour: turf.pricePerHour,
      peakPrice: turf.peakPrice,
      peakHours: turf.peakHours,
      tournamentConfig: turf.tournamentConfig,
    };

    const ownerDetails = {
      qrCode: turf.owner?.qrCode,
      upiId: turf.owner?.upiId,
      bankDetails: turf.owner?.bankDetails,
    };

    console.log("Serving TimeSlot Request for Date:", date);
    console.log("Owner Details found:", ownerDetails);

    return res.status(200).json({ timeSlots, bookedTime, ownerDetails });
  } catch (error) {
    console.log(chalk.red("Error in getTimeSlotByTurfId"), error);
    return res.status(500).json({ message: error.message });
  }
};
