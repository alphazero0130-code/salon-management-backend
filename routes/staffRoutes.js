import express from "express";
import { authorizeRoles, protect } from "../middleware/authMiddleware.js";
import staffConstroller from "../controllers/staffConstroller.js";
const router = express.Router();

router.get("/", protect, authorizeRoles("admin"), staffConstroller.fetchStaff);
router.post("/", protect, authorizeRoles("admin"), staffConstroller.createStaff);
router.get(
  "/:id",
  protect,
  authorizeRoles("admin"),
  staffConstroller.fetchStaff,
);
router.put("/:id", protect, authorizeRoles("admin"), staffConstroller.updateStaff);
router.patch("/:id", protect, authorizeRoles("admin"), staffConstroller.updateEachField);
router.delete("/:id", protect, authorizeRoles("admin"), staffConstroller.deleteStaff);

export default router;
