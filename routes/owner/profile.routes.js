import express from "express";
import { updateOwnerProfile, getOwnerProfile } from "../../controllers/owner/profile.controller.js";
import verifyOwnerToken from "../../middleware/jwt/owner.middleware.js";

const profileRouter = express.Router();

profileRouter.get("/", verifyOwnerToken, getOwnerProfile);
profileRouter.put("/", verifyOwnerToken, updateOwnerProfile);

export default profileRouter;
