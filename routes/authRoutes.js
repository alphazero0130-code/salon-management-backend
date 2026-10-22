import express from "express";
import  authController  from "../controllers/authController.js";
import { authorizeRoles, protect } from "../middleware/authMiddleware.js";

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
router.get("/user",protect ,authorizeRoles("admin"), authController.fetchUser);

/**
 * @swagger
 * /api/auth/user/role:
 *   patch:
 *     summary: Update a user's role (admin only)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, roleType]
 *             properties:
 *               userId:
 *                 type: string
 *               roleType:
 *                 type: string
 *                 enum: [admin, staff]
 *     responses:
 *       200:
 *         description: User role updated successfully
 *       400:
 *         description: Invalid userId or roleType
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin role required
 *       404:
 *         description: User not found
 */
router.patch(
  "/user/role",
  protect,
  authorizeRoles("admin"),
  authController.updateUserRole,
);

/**
 * @swagger
 * /api/auth/user/password:
 *   patch:
 *     summary: Update a user's password (admin only)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, newPassword, confirmPassword]
 *             properties:
 *               userId:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *               confirmPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Invalid password or userId
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin role required
 *       404:
 *         description: User not found
 */
router.patch(
  "/user/password",
  protect,
  authorizeRoles("admin"),
  authController.updateUserPassword,
);

export default router;