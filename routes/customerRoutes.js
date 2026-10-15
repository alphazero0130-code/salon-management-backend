import express from "express";
import customerController from "../controllers/customerController.js";
import  {protect, authorizeRoles}  from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/{:id}", protect ,customerController.getCustomer); // protect checks the token.

router.post("/", protect, customerController.createCustomer);

router.put("/:id", protect, customerController.updateCustomer);

router.patch("/:id", protect, customerController.updateField);

router.delete("/:id", protect, authorizeRoles("admin"),customerController.deleteCustomer);

export default router;
