import express from "express";
import  authController  from "../controllers/authController.js";

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a staff user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       201:
 *         description: Registration successful
 *       400:
 *         description: Invalid or missing registration details
 *       409:
 *         description: Email is already registered
 */
router.post("/register", authController.registerUser);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in and receive a JWT
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Email or password is missing
 *       401:
 *         description: Invalid email or password
 */
router.post("/login", authController.loginUser);

/**
 * @swagger
 * /api/auth/user:
 *   get:
 *     summary: Fetch users
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Users fetched successfully
 */
router.get("/user", authController.fetchUser);

export default router;