import mongoose from "mongoose";
import User from "../models/User.js";
import Customer from "../models/Customer.js";
import Staff from "../models/Staff.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomInt } from "node:crypto";
import sendSuccess from "../utils/apiResponse.js";
import sendOtpEmail from "../utils/emailService.js";
import EmailOtp from "../models/EmailOtp.js";

const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body ?? {};

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      const error = new Error("Name, email and password are required");
      error.statusCode = 400;
      return next(error);
    }

    if (password.length < 8) {
      const error = new Error("Password must be at least 8 characters");
      error.statusCode = 400;
      return next(error);
    }

    const normalizedRole = (role?.trim() || "customer").toLowerCase();

    // Public registration is for customers only; staff are added by an admin.
    if (normalizedRole !== "customer") {
      const error = new Error(
        "Only customers can register. Staff accounts are added by an administrator",
      );
      error.statusCode = 403;
      return next(error);
    }

    if (!phone?.trim()) {
      const error = new Error("Phone number is required");
      error.statusCode = 400;
      return next(error);
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      // An active account cannot be registered again.
      if (existingUser.status === "active") {
        const error = new Error("Email is already registered");
        error.statusCode = 409;
        return next(error);
      }

      // Clear a previous, never-verified registration so it can be started fresh.
      await Customer.deleteMany({ user: existingUser._id });
      await Staff.deleteMany({ user: existingUser._id });
      await User.deleteOne({ _id: existingUser._id });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Save the login record. It stays inactive until the email OTP is verified.
    const user = await User.create({
      email: normalizedEmail,
      password: passwordHash,
      role: normalizedRole,
      status: "inactive",
    });

    // Save the customer profile data in the Customer table.
    try {
      await Customer.create({
        user: user._id,
        name: name.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
      });
    } catch (profileError) {
      // Roll back the login record so we never leave a User without a profile.
      await User.deleteOne({ _id: user._id });
      throw profileError;
    }

    const otp = String(randomInt(100000, 1000000));

    const otpHash = await bcrypt.hash(otp, 10);

    await EmailOtp.deleteMany({
      email: normalizedEmail,
      purpose: "registration",
    });

    await EmailOtp.create({
      email: normalizedEmail,
      purpose: "registration",
      otpHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    await sendOtpEmail(normalizedEmail, otp, "registration");

    return sendSuccess(
      res,
      "Verification code sent to your email",
      { email: normalizedEmail },
    );
  } catch (error) {
    if (error.code === 11000) {
      const anotherRrror = new Error("Email is already registered");
      anotherRrror.statusCode = 409;
      return next(anotherRrror);
    }

    next(error);
  }
};

const verifyRegistrationOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body ?? {};

    if (!email?.trim() || !otp?.trim()) {
      const error = new Error("Email and OTP are required");
      error.statusCode = 400;
      return next(error);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailOtp = await EmailOtp.findOne({
      email: normalizedEmail,
      purpose: "registration",
    }).select("+otpHash"); // compare the submitted OTP with otpHash

    if (!emailOtp || emailOtp.expiresAt <= new Date()) {
      const error = new Error("Invalid or expired verification code");
      error.statusCode = 400;
      return next(error);
    }

    const isOtpCorrect = await bcrypt.compare(otp.trim(), emailOtp.otpHash);

    if (!isOtpCorrect) {
      const error = new Error("Invalid or expired verification code");
      error.statusCode = 400;
      return next(error);
    }

    // Activate the account that was created during registration.
    const user = await User.findOneAndUpdate(
      { email: normalizedEmail },
      { status: "active" },
      { returnDocument: "after" },
    );

    if (!user) {
      const error = new Error("Registration not found. Please register again");
      error.statusCode = 400;
      return next(error);
    }

    // Read the profile name from the right table for the response.
    const profile =
      user.role === "customer"
        ? await Customer.findOne({ user: user._id })
        : await Staff.findOne({ user: user._id });

    await EmailOtp.deleteOne({ _id: emailOtp._id });

    return sendSuccess(
      res,
      "Registration successful",
      {
        user: {
          id: user._id,
          name: profile?.name ?? null,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error.code === 11000) {
      const duplicateError = new Error("Email is already registered");
      duplicateError.statusCode = 409;
      return next(duplicateError);
    }

    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};

    if (!email?.trim() || !password?.trim()) {
      const error = new Error("email and password are required");
      error.statusCode = 400;
      return next(error);
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find the user, including the password hash
    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    if (!user || !user.password) {
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      return next(error);
    }

    // Compare the entered password with the saved hash
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      return next(error);
    }

    // Only active accounts are allowed to log in
    if (user.status !== "active") {
      const error = new Error(
        "Your account is not active. Please verify your email or contact the administrator.",
      );
      error.statusCode = 403;
      return next(error);
    }

    // Load the matching profile so the name can be returned from the right table
    const profile =
      user.role === "customer"
        ? await Customer.findOne({ user: user._id })
        : await Staff.findOne({ user: user._id });

    // Create the JWT

    const token = jwt.sign(
      {
        role: user.role,
      },
      process.env.JWT_SECRET, // The secret is used to create and verify tokens; the actual token is generated when the user logs in.
      {
        subject: user._id.toString(), // subject identifies the user by their MongoDB ID.
        expiresIn: process.env.JWT_EXPIRES_IN || "1h",
      },
    );

    return sendSuccess(res, "Login successful", {
      token,
      user: {
        id: user._id,
        name: profile?.name ?? null,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
    // Return the token and safe user details
  } catch (error) {
    next(error);
  }
};

const fetchUser = async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);

    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10),
    );

    const { role, status, search } = req.query;
    const filter = {};

    if (role) {
      if (!["admin", "staff", "customer"].includes(role)) {
        const error = new Error("Role must be admin, staff or customer");
        error.statusCode = 400;
        return next(error);
      }
      filter.role = role;
    }

    if (status) {
      if (!["active", "inactive"].includes(status)) {
        const error = new Error("Status must be active or inactive");
        error.statusCode = 400;
        return next(error);
      }
      filter.status = status;
    }

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.email = { $regex: escapedSearch, $options: "i" };
    }

    const users = await User.find(filter)
      .sort({ createdAt: -1, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalUser = await User.countDocuments(filter);

    if (totalUser === 0) {
      const error = new Error("No user found");
      error.statusCode = 200;
      return next(error);
    }

    // Pull the profile for each user from the Customer and Staff tables.
    const userIds = users.map((item) => item._id);

    const [customers, staff] = await Promise.all([
      Customer.find({ user: { $in: userIds } }),
      Staff.find({ user: { $in: userIds } }),
    ]);

    const profileByUser = new Map();
    for (const item of customers) profileByUser.set(String(item.user), item);
    for (const item of staff) profileByUser.set(String(item.user), item);

    const user = users.map((item) => ({
      id: item._id,
      email: item.email,
      role: item.role,
      status: item.status,
      profile: profileByUser.get(String(item._id)) ?? null,
    }));

    return sendSuccess(
      res,
      "User fetched successfully",
      { user },
      {
        pagination: {
          page,
          limit,
          total: totalUser,
          totalPages: Math.ceil(totalUser / limit),
        },
      },
    );
  } catch (error) {
    next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { userId, roleType } = req.body ?? {};

    if (!mongoose.isObjectIdOrHexString(userId)) {
      const error = new Error("userId must be a valid MongoDB ObjectId");
      error.statusCode = 400;
      return next(error);
    }

    if (!["admin", "staff", "customer"].includes(roleType)) {
      const error = new Error("roleType must be admin, staff or customer");
      error.statusCode = 400;
      return next(error);
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role: roleType },
      { returnDocument: "after", runValidators: true },
    );

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 200;
      return next(error);
    }

    return sendSuccess(res, "User role updated successfully", {
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateUserPassword = async (req, res, next) => {
  try {
    const { userId, newPassword, confirmPassword } = req.body ?? {};

    if (!mongoose.isObjectIdOrHexString(userId)) {
      const error = new Error("userId must be a valid MongoDB ObjectId");
      error.statusCode = 400;
      return next(error);
    }

    if (!newPassword || !confirmPassword) {
      const error = new Error("newPassword and confirmPassword are required");
      error.statusCode = 400;
      return next(error);
    }

    if (newPassword !== confirmPassword) {
      const error = new Error(
        "newPassword and confirmPassword must match",
      );
      error.statusCode = 400;
      return next(error);
    }

    if (newPassword.length < 8) {
      const error = new Error("Password must be at least 8 characters");
      error.statusCode = 400;
      return next(error);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await User.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { returnDocument: "after", runValidators: true },
    );

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 200;
      return next(error);
    }

    return sendSuccess(res, "Password updated successfully", {
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  registerUser,
  verifyRegistrationOtp,
  loginUser,
  fetchUser,
  updateUserRole,
  updateUserPassword,
};
