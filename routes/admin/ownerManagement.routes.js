import { Router } from "express";
import {
  getAllOwners,
  getTurfByOwnerId,
  deleteOwner,
  toggleMaintenanceStatus,
} from "../../controllers/admin/ownerManagement.controller.js";

const ownerManagementRouter = Router();

ownerManagementRouter.get("/list", getAllOwners);
ownerManagementRouter.get("/:id/turf", getTurfByOwnerId);
ownerManagementRouter.delete("/delete/:id", deleteOwner);
ownerManagementRouter.put("/toggle-maintenance/:id", toggleMaintenanceStatus);

export default ownerManagementRouter;