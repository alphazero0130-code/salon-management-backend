import express from "express";
import serviceController from "../controllers/serviceController.js";
import  {protect, authorizeRoles} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, serviceController.createService);
router.get("/", protect, serviceController.getServices);
router.get("/:id", protect, serviceController.getServices);
router.put("/:id", protect, serviceController.updateService);
router.patch("/:id", protect, serviceController.updateField);
router.delete("/:id", protect, authorizeRoles("admin"), serviceController.deleteService);

export default router;