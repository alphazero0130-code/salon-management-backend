import express from "express";
import { authorizeRoles, protect } from "../middleware/authMiddleware.js";
import adminDashboardController from "../controllers/adminDashboardController.js";

const router = express.Router();

router.get(
  "/stats",
  protect,
  authorizeRoles("admin"),
  adminDashboardController.getDashboardStats,
);

export default router;
