import express from "express";
import { authorizeRoles, protect } from "../middleware/authMiddleware.js";
import dashboardController from "../controllers/dashboardController.js";

const router = express.Router();

// One dashboard for every role. The controller returns the same response shape
// for all roles and tags it with the caller's role.
router.get(
  "/",
  protect,
  authorizeRoles("admin", "staff", "customer"),
  dashboardController.getDashboard,
);

export default router;
