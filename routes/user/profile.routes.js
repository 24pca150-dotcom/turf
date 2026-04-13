import { Router } from "express";
import { updateBankDetails } from "../../controllers/user/user.controller.js";
import verifyUserToken from "../../middleware/jwt/user.middleware.js";

const profileRouter = Router();

profileRouter.put("/bank-details", verifyUserToken, updateBankDetails);

export default profileRouter;
