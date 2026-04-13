import { Router } from "express";
import {
  createBooking,
  createOrder,
  getBookings,
  cancelBooking,
} from "../../controllers/user/booking.controller.js";
import verifyUserToken from "../../middleware/jwt/user.middleware.js";

const bookingRouter = Router();

bookingRouter.post("/create-order", verifyUserToken, createOrder);
bookingRouter.post("/create-booking", verifyUserToken, createBooking);
bookingRouter.post("/cancel-booking", verifyUserToken, cancelBooking);
bookingRouter.get("/get-bookings", verifyUserToken, getBookings);

export default bookingRouter;
