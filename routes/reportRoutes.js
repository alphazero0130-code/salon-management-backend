import express from "express";
import { authorizeRoles, protect } from "../middleware/authMiddleware.js";
import reportController from "../controllers/reportController.js";

const router = express.Router();

router.get(
  "/revenue",
  protect,
  authorizeRoles("admin"),
  reportController.getRevenueReport,
);

export default router;
