import express from "express";
import appointmentController from "../controllers/appointmentController.js"

const router = express.Router();

router.post("/", appointmentController.createAppointment);
router.get("/", appointmentController.getAppointment);
router.get("/:id", appointmentController.getAppointment);
router.put("/:id", appointmentController.updateAppointment);
router.patch("/:id", appointmentController.updateField);
router.delete("/:id", appointmentController.deleteAppointment);
router.get("/reports/revenue", appointmentController.getRevenueSummary);
router.get("/reports/services", appointmentController.getRevenueByService);


export default router;