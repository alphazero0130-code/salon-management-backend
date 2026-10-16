import express from "express";
import appointmentController from "../controllers/appointmentController.js"
import  {protect, authorizeRoles} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, authorizeRoles("admin"), appointmentController.createAppointment);
router.get("/", protect, appointmentController.getAppointment);
router.get("/:id", protect, appointmentController.getAppointment);
router.put("/:id", protect, authorizeRoles("admin"),appointmentController.updateAppointment);
router.patch("/:id", protect, authorizeRoles("admin"),appointmentController.updateField);
router.delete("/:id", protect, authorizeRoles("admin"), appointmentController.deleteAppointment);
router.get("/reports/revenue", protect, authorizeRoles("admin"), appointmentController.getRevenueSummary);
router.get("/reports/services", protect, authorizeRoles("admin"), appointmentController.getRevenueByService);


export default router;