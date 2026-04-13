import express from "express";
import { getNotifications, markAsRead, markAllAsRead } from "../controllers/common/notification.controller.js";
import userAuth from "../middleware/jwt/user.middleware.js";
import ownerAuth from "../middleware/jwt/owner.middleware.js";

const router = express.Router();

// Mixed middleware approach or separate routes
// Since we have separate auth middlewares, we can either have two routers or check both.
// Let's create two separate entry points in the root router for simplicity.

router.get("/user", userAuth, getNotifications);
router.put("/user/read/:notificationId", userAuth, markAsRead);
router.put("/user/read-all", userAuth, markAllAsRead);

router.get("/owner", ownerAuth, getNotifications);
router.put("/owner/read/:notificationId", ownerAuth, markAsRead);
router.put("/owner/read-all", ownerAuth, markAllAsRead);

export default router;
