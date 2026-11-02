import express from "express";
import customerController from "../controllers/customerController.js";
import  {protect, authorizeRoles}  from "../middleware/authMiddleware.js";

const router = express.Router();

// Customer records hold personal data (name, email, phone), so management is
// restricted to staff and admins. Without a role check here, any authenticated
// customer could read, edit, or create other customers' records (IDOR / BOLA).
router.get("/{:id}", protect, authorizeRoles("admin", "staff"), customerController.getCustomer);

router.post("/", protect, authorizeRoles("admin", "staff"), customerController.createCustomer);

router.put("/:id", protect, authorizeRoles("admin", "staff"), customerController.updateCustomer);

router.patch("/:id", protect, authorizeRoles("admin", "staff"), customerController.updateField);

router.delete("/:id", protect, authorizeRoles("admin"), customerController.deleteCustomer);

export default router;
