import express from "express";
import { authorizeRoles, protect } from "../middleware/authMiddleware.js";
import paymentController from "../controllers/paymentController.js";

const router = express.Router();

router.get(
  "/",
  // protect,
  // authorizeRoles("admin"),
  paymentController.getPayment,
);
router.get(
  "/:type",
  // protect,
  // authorizeRoles("admin"),
  paymentController.getPayment,
);

export default router;
