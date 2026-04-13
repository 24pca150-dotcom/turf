import express from "express";
import {
    getOwnerBookings,
    verifyBooking,
    processRefund,
} from "../../controllers/owner/booking.controller.js";
import verifyOwnerToken from "../../middleware/jwt/owner.middleware.js";

const bookingsRouter = express.Router();
bookingsRouter.get("/", verifyOwnerToken, getOwnerBookings);

bookingsRouter.put("/verify", verifyOwnerToken, verifyBooking);
bookingsRouter.put("/refund", verifyOwnerToken, processRefund);

export default bookingsRouter;