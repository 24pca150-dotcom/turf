import { Router } from "express";
import {
  turfRegister,
  getTurfByOwner,
  editTurfById,
  deleteTurf,
} from "../../controllers/owner/turf.controller.js";
import upload from "../../middleware/uploads/upload.middleware.js";
import verifyOwnerToken from "../../middleware/jwt/owner.middleware.js";

const turfRouter = Router();

turfRouter.post(
  "/register",
  verifyOwnerToken,
  upload.single("image"),

  turfRegister
);

turfRouter.get("/all", verifyOwnerToken, getTurfByOwner);
turfRouter.put("/:id", verifyOwnerToken, editTurfById);
turfRouter.delete("/delete/:id", verifyOwnerToken, deleteTurf);


export default turfRouter;
