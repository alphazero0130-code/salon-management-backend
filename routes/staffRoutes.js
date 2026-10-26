import express from "express";
import { authorizeRoles, protect } from "../middleware/authMiddleware.js";
import staffController from "../controllers/staffController.js";
const router = express.Router();

router.get("/", protect, authorizeRoles("admin"), staffController.fetchStaff);
router.post("/", protect, authorizeRoles("admin"), staffController.createStaff);
router.get(
  "/:id",
  protect,
  authorizeRoles("admin"),
  staffController.fetchStaff,
);
router.put("/:id", protect, authorizeRoles("admin"), staffController.updateStaff);
router.patch("/:id", protect, authorizeRoles("admin"), staffController.updateEachField);
router.delete("/:id", protect, authorizeRoles("admin"), staffController.deleteStaff);

export default router;
