import mongoose from "mongoose";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sendSuccess from "../utils/apiResponse.js";

const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email.trim() || !password.trim()) {
      const error = new Error("Name, email and password are required");
      error.statusCode = 400;
      return next(error);
    }

    if (password.length < 8) {
      const error = new Error("Password must be at least 8 characters");
      error.statusCode = 400;
      return next(error);
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      const error = new Error("Email is already registered");
      error.statusCode = 409;
      return next(error);
    }

    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the bcrypt cost factor, which controls how much work hashing takes.

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "staff",
    });

    return sendSuccess(
      res,
      "Registration successful",
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 },
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

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password.trim()) {
      const error = new Error("email and password are required");
      error.statusCode = 400;
      return next(error);
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find the user, including the password hash
    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    if (!user) {
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
        name: user.name,
        email: user.email,
        role: user.role,
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
    const user = await User.find().skip((page - 1) * limit)
      .limit(limit);

    

 if (user.length === 0 ) {
        const error = new Error("No user detail found");
        error.statusCode = 200;
        return next(error);
      }

    return sendSuccess(res, "User fetched successfully", { user });
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

    if (!["admin", "staff"].includes(roleType)) {
      const error = new Error("roleType must be either admin or staff");
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
      error.statusCode = 404;
      return next(error);
    }

    return sendSuccess(res, "User role updated successfully", {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
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
      error.statusCode = 404;
      return next(error);
    }

    return sendSuccess(res, "Password updated successfully", {
      user: {
        id: user._id,
        name: user.name,
      },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  registerUser,
  loginUser,
  fetchUser,
  updateUserRole,
  updateUserPassword,
};
