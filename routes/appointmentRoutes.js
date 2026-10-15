import express from "express";
import appointmentController from "../controllers/appointmentController.js"
import  {protect, authorizeRoles} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect,appointmentController.createAppointment);
router.get("/", protect, appointmentController.getAppointment);
router.get("/:id", protect, appointmentController.getAppointment);
router.put("/:id", protect, appointmentController.updateAppointment);
router.patch("/:id", protect, appointmentController.updateField);
router.delete("/:id", protect, authorizeRoles("admin"), appointmentController.deleteAppointment);
router.get("/reports/revenue", protect, appointmentController.getRevenueSummary);
router.get("/reports/services", protect, appointmentController.getRevenueByService);


export default router;