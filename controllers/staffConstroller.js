import mongoose from "mongoose";
import Staff from "../models/Staff.js";

const createStaff = async (req, res, next) => {
  try {
    const { name, email, jobTitle } = req.body;

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await Staff.findOne({ email: normalizedEmail });

    if (existingUser) {
      const error = new Error("Staff is already registered");
      error.statusCode = 409;
      return next(error);
    }

    const staff = await Staff.create({
      name,
      email,
      jobTitle,
    });

    return res.status(201).json({
      success: true,
      message: "Staff added Successfully",
      staff: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        jobTitle: staff.jobTitle,
      },
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const validationError = new Error("Validation Error");
      validationError.statusCode = 400;
      validationError.errors = Object.values(error.errors).map(
        (item) => item.message,
      );
      return next(validationError);
    }
    return next(error);
  }
};

const fetchStaff = async (req, res, next) => {
  try {
    const id = req.params?.id;

    if (id) {
      if (!mongoose.isObjectIdOrHexString(id)) {
        const error = new Error("Staff id must be a valid MongoDB ObjectId");
        error.statusCode = 400;
        return next(error);
      }

      const staff = await Staff.findById(id);

      if (!staff) {
        const error = new Error("Staff not found");
        error.statusCode = 404;
        return next(error);
      }

      return res.status(200).json({
        success: true,
        message: "Staff data fetched successfully",
        staff
      });
    }

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);

    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10),
    );

    const { search, sortBy } = req.query;
    const filter = {};

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.name = { $regex: escapedSearch, $options: "i" };
    }

    const allowedSortFields = ["name", "createdAt"];
    const selectedSort = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const staff = await Staff.find(filter)
      .sort({ [selectedSort]: selectedSort === "name" ? 1 : -1, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalStaff = await Staff.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: "Staff data fetched successfully",
      totalStaff,
      page,
      limit,
      totalPages: Math.ceil(totalStaff / limit),
      staff
    });
  } catch (error) {
    next(error);
  }
};

export default { createStaff, fetchStaff };
