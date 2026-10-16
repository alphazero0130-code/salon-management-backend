import express from "express";
import serviceController from "../controllers/serviceController.js";
import  {protect, authorizeRoles} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, authorizeRoles("admin"),serviceController.createService);
router.get("/", protect, serviceController.getServices);
router.get("/:id", protect, serviceController.getServices);
router.put("/:id", authorizeRoles("admin"),protect, serviceController.updateService);
router.patch("/:id", authorizeRoles("admin"),protect, serviceController.updateField);
router.delete("/:id", protect, authorizeRoles("admin"), serviceController.deleteService);

export default router;