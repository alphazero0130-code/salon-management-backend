import mongoose from "mongoose";
import Staff from "../models/Staff.js";
import Appointment from "../models/Appointment.js";
import sendSuccess from "../utils/apiResponse.js";

const createStaff = async (req, res, next) => {
  try {
    const { name, email, jobTitle } = req.body;

    if (!name?.trim() || !email?.trim() || !jobTitle?.trim()) {
      const error = new Error("Name, email and job title are required");
      error.statusCode = 400;
      return next(error);
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await Staff.findOne({ email: normalizedEmail });

    if (existingUser) {
      const error = new Error("Staff is already registered");
      error.statusCode = 409;
      return next(error);
    }

    const staff = await Staff.create({
      name,
      email: normalizedEmail,
      jobTitle,
    });

    return sendSuccess(
      res,
      "Staff added successfully",
      {
        staff: {
          id: staff._id,
          name: staff.name,
          email: staff.email,
          jobTitle: staff.jobTitle,
        },
      },
      { status: 201 },
    );
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
        const error = new Error("No staff detail found");
        error.statusCode = 200;
        return next(error);
      }

      return sendSuccess(res, "Staff fetched successfully", { staff });
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

    if (totalStaff === 0) {
      const error = new Error("No staff found");
      error.statusCode = 200;
      return next(error);
    }

    return sendSuccess(
      res,
      "Staff data fetched successfully",
      { staff },
      {
        pagination: {
          page,
          limit,
          total: totalStaff,
          totalPages: Math.ceil(totalStaff / limit),
        },
      },
    );
  } catch (error) {
    return next(error);
  }
};



const updateStaff = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isObjectIdOrHexString(id)) {
      const error = new Error("Staff id must be a valid MongoDB ObjectId");
      error.statusCode = 400;
      return next(error);
    }

    const staff = await Staff.findByIdAndUpdate(id, req.body, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!staff) {
      const error = new Error("Staff not found");
      error.statusCode = 200;
      return next(error);
    }

    return sendSuccess(res, "Staff updated successfully", { staff });
  } catch (error) {
    return next(error);
  }
};

const updateEachField = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isObjectIdOrHexString(id)) {
      const error = new Error("Staff id must be a valid MongoDB ObjectId");
      error.statusCode = 400;
      return next(error);
    }

    const allowedField = ["name", "email", "jobTitle"];
    const update = {};

    for (const field of allowedField) {
      if (req.body?.[field] != undefined) {
        update[field] = req.body[field];
      }
    }

    if (Object.keys(update).length === 0) {
      const error = new Error(
        "Please provide at least one valid field to update",
      );
      error.statusCode = 400;
      return next(error);
    }

    const staff = await Staff.findByIdAndUpdate(id, update, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!staff) {
      const error = new Error("Staff not found");
      error.statusCode = 200;
      return next(error);
    }

    return sendSuccess(res, "Staff updated successfully", { staff });
  } catch (error) {
    return next(error);
  }
};

const deleteStaff = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isObjectIdOrHexString(id)) {
      const error = new Error("Staff id must be a valid MongoDB ObjectId");
      error.statusCode = 400;
      return next(error);
    }

    const linkedAppointments = await Appointment.countDocuments({ staff: id });

    if (linkedAppointments > 0) {
      const staff = await Staff.findByIdAndUpdate(
        id,
        { isActive: false, isAvailable: false },
        { returnDocument: "after", runValidators: true },
      );

      if (!staff) {
        const error = new Error("Staff not found");
        error.statusCode = 200;
        return next(error);
      }

      return sendSuccess(
        res,
        "Staff has linked appointments and was deactivated instead of deleted",
        { staff },
      );
    }

    const staff = await Staff.findByIdAndDelete(id);

    if (!staff) {
      const error = new Error("Staff not found");
      error.statusCode = 200;
      return next(error);
    }

    return sendSuccess(res, "Staff deleted successfully", { staff });
  } catch (error) {
    return next(error);
  }
};

export default {
  createStaff,
  fetchStaff,
  updateStaff,
  updateEachField,
  deleteStaff,
};
