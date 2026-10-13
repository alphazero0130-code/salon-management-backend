import express from "express";
import serviceController from "../controllers/serviceController.js";

const router = express.Router();

router.post("/", serviceController.createService);
router.get("/", serviceController.getServices);
router.get("/:id", serviceController.getServices);
router.put("/:id", serviceController.updateService);
router.patch("/:id", serviceController.updateField);
router.delete("/:id", serviceController.deleteService);

export default router;