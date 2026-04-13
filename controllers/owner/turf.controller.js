import { validationResult } from "express-validator";
import cloudinary from "../../utils/cloudinary.js";
import Turf from "../../models/turf.model.js";
import chalk from "chalk";
import Review from "../../models/review.model.js"

export const turfRegister = async (req, res) => {
  const image = req.file.path;
  const owner = req.owner.id;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array() });
  }
  try {
    let turfImageUrl = null;
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloudinary_cloud_name') {
      // upload the turf image to cloudinary
      const turfImage = await cloudinary.uploader.upload(image, {
        folder: "Turf Sport/turfs",
      });
      turfImageUrl = turfImage.secure_url;
    } else {
      // Use a placeholder image if Cloudinary not configured
      turfImageUrl = "https://via.placeholder.com/300x200?text=Turf+Image";
    }
    const turf = new Turf({
      image: turfImageUrl,
      owner,
      ...req.body,
    });
    await turf.save();
    return res
      .status(201)
      .json({ success: true, message: "Turf created successfully" });
  } catch (err) {
    console.error(chalk.red(err.message));
    return res.status(500).json({ success: false, message: err.message });
  }
};

// get all turfs by owner id

export const getTurfByOwner = async (req, res) => {
  const ownerId = req.owner.id;

  try {
    const turfs = await Turf.find({ owner: ownerId });

    // get all reviews by turf id of owner
    const turfsWithAvgRating = await Promise.all(
      turfs.map(async (turf) => {
        const reviewCount = turf.reviews ? turf.reviews.length : 0;
        const avgRating =
          reviewCount > 0
            ? await Review.aggregate([
              { $match: { turf: turf._id } },
              { $group: { _id: null, avgRating: { $avg: "$rating" } } },
            ])
            : 0;
        return {
          ...turf.toObject(),
          avgRating: avgRating[0] ? avgRating[0].avgRating : 0,
        };
      })
    );

    return res.status(200).json(turfsWithAvgRating);
  } catch (err) {
    console.error("Error getting turfs by ownerId", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

//  edit turf by id

export const editTurfById = async (req, res) => {
  const ownerId = req.owner.id;
  const turfId = req.params.id; // Use req.params.id directly

  console.log(chalk.blue(`[Update Request] TurfID: ${turfId}, OwnerID: ${ownerId}`));

  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ success: false, message: "No update data provided" });
  }

  // Destructure and exclude internal/read-only fields from the update payload
  const {
    _id,
    owner,
    createdAt,
    updatedAt,
    __v,
    reviews,
    avgRating,
    sportTypes,
    sportsType,
    ...otherDetails // tournamentConfig stays here so it IS included in the update
  } = req.body;

  try {
    const existingTurf = await Turf.findOne({ owner: ownerId, _id: turfId });
    if (!existingTurf) {
      return res
        .status(404)
        .json({ success: false, message: "Turf not found" });
    }

    // Merge sportTypes: use provided ones, or keep existing ones. Ensure it's an array.
    let finalSportTypes = Array.isArray(sportTypes)
      ? sportTypes
      : Array.isArray(existingTurf.sportTypes)
        ? existingTurf.sportTypes
        : [];

    if (sportsType && !finalSportTypes.includes(sportsType)) {
      finalSportTypes = [...finalSportTypes, sportsType];
    }

    const updatedTurfData = {
      ...otherDetails,
      sportTypes: finalSportTypes,
    };

    // Use $set to be explicit and avoid any accidental overhead or immutable field conflicts
    // Removed runValidators: true to prevent false required-field errors on partial updates
    await Turf.findOneAndUpdate(
      { owner: ownerId, _id: turfId },
      { $set: updatedTurfData },
      { new: true } // Removed runValidators: true
    );

    // Re-fetch all turfs for this owner with recalculated avgRating to keep management UI consistent
    const turfs = await Turf.find({ owner: ownerId });
    const turfsWithAvgRating = await Promise.all(
      turfs.map(async (turf) => {
        const reviewCount = turf.reviews ? turf.reviews.length : 0;
        let calculatedAvgRating = 0;

        if (reviewCount > 0) {
          const aggregateResult = await Review.aggregate([
            { $match: { turf: turf._id } },
            { $group: { _id: null, avgRating: { $avg: "$rating" } } },
          ]);
          calculatedAvgRating = aggregateResult[0] ? aggregateResult[0].avgRating : 0;
        }

        return {
          ...turf.toObject(),
          avgRating: calculatedAvgRating,
        };
      })
    );

    console.log(chalk.green(`[Update Success] TurfID: ${turfId}`));
    return res.status(200).json({
      success: true,
      message: "Turf updated successfully",
      allTurfs: turfsWithAvgRating,
    });
  } catch (err) {
    console.error(chalk.red(`[Update Error] TurfID: ${turfId}:`), err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
// delete turf by id
// delete turf by id
export const deleteTurf = async (req, res) => {
  const owner = req.owner.id;
  const { id } = req.params;

  console.log(`Attempting to delete turf. TurfID: ${id}, OwnerID: ${owner}`);

  try {
    const deletedTurf = await Turf.findOneAndDelete({ _id: id, owner: owner });

    if (!deletedTurf) {
      console.log("Turf not found or unauthorized deletion attempt.");
      return res.status(404).json({ success: false, message: "Turf not found or unauthorized" });
    }

    console.log("Turf deleted successfully.");
    return res.status(200).json({ success: true, message: "Turf deleted successfully" });
  } catch (err) {
    console.error("Error in deleteTurf:", err);
    if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: "Invalid Turf ID format" });
    }
    return res.status(500).json({ success: false, message: `Server error: ${err.message}` });
  }
};
