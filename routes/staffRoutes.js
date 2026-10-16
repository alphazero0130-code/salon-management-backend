import express from "express";
import { authorizeRoles, protect } from "../middleware/authMiddleware.js";
import staffConstroller from "../controllers/staffConstroller.js";
const router = express.Router();

router.get("/", protect, authorizeRoles("staff"), staffConstroller.fetchStaff);
router.get(
  "/:id",
  protect,
  authorizeRoles("staff"),
  staffConstroller.fetchStaff,
);
router.post("/", protect, authorizeRoles("staff"), staffConstroller.createStaff);
router.put("/:id", protect, authorizeRoles("staff"), staffConstroller.updateStaff);
router.patch("/:id", protect, authorizeRoles("staff"), staffConstroller.updateEachField);
router.delete("/:id", protect, authorizeRoles("staff"), staffConstroller.deleteStaff);

export default router;
