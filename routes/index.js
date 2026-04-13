import { Router } from "express";
import userRouter from "./user/user.routes.js";
import ownerRouter from "./owner/owner.routes.js";
import adminRouter from "./admin/admin.routes.js";
import notificationRouter from "./notification.routes.js";
import dotenv from "dotenv";
dotenv.config();


const rootRouter = Router();

rootRouter.use("/user", userRouter);
rootRouter.use("/owner", ownerRouter)
rootRouter.use("/admin", adminRouter)
rootRouter.use("/notifications", notificationRouter);

export default rootRouter;
