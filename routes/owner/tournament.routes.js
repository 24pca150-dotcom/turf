import express from "express";
import {
    getTournamentRegistrations,
    updateRegistrationStatus,
} from "../../controllers/owner/tournament.controller.js";

const router = express.Router();

router.get("/registrations", getTournamentRegistrations);
router.put("/registrations/:id/status", updateRegistrationStatus);

export default router;
