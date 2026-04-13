import { Router } from "express";
import {
    getRefundRequests,
    processRefund,
} from "../../controllers/admin/refund.controller.js";
import verifyAdminToken from "../../middleware/jwt/admin.middleware.js";

const refundRouter = Router();

refundRouter.get("/requests", verifyAdminToken, getRefundRequests);
refundRouter.post("/process", verifyAdminToken, processRefund);

export default refundRouter;
