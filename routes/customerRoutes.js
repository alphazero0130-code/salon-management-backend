import express from "express";
import customerController from "../controllers/customerController.js";

const router = express.Router();

router.get("/{:id}", customerController.getCustomer);

router.post("/", customerController.createCustomer);

router.put("/:id", customerController.updateCustomer);

router.patch("/:id", customerController.updateField);

router.delete("/:id", customerController.deleteCustomer);

export default router;
