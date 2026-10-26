import mongoose from "mongoose";
import Customer from "../models/Customer.js";
import sendSuccess from "../utils/apiResponse.js";

const createCustomer = async (req, res, next) => {
  try {
    const { name, phone, email, status } = req.body;

    const customer = await Customer.create({
      name,
      phone,
      email,
      status,
    });

    return sendSuccess(
      res,
      "Customer created successfully",
      { customer },
      { status: 201 },
    );
  } catch (error) {
    if (error.name === "ValidationError") {
      const validationError = new Error("Validation failed");
      validationError.statusCode = 400;
      validationError.errors = Object.values(error.errors).map(
        (item) => item.message,
      );
      return next(validationError);
    }
    next(error);
  }
};

const getCustomer = async (req, res, next) => {
  try {
    const id = req.params.id?.trim();
    if (id) {
      if (!mongoose.isObjectIdOrHexString(id)) {
        const error = new Error("Customer id must be a valid MongoDB ObjectId");
        error.statusCode = 400;
        return next(error);
      }

      const customer = await Customer.findById(id);

      if (!customer) {
        const error = new Error("Customer not found");
        error.statusCode = 200;
        return next(error);
      }

      return sendSuccess(res, "Customer fetched successfully", { customer });
    }

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);

    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10),
    );

    const { search, status, sortBy } = req.query;
    const filter = {};

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.name = { $regex: escapedSearch, $options: "i" };
    }

    if (status) {
      if (!["active", "inactive"].includes(status)) {
        const error = new Error("Status must be active or inactive");
        error.statusCode = 400;
        return next(error);
      }
      filter.status = status;
    }

    const allowedSortFields = ["name", "createdAt"];

    const selectedSort = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";
      
    const customers = await Customer.find(filter)
      .sort({ [selectedSort]: selectedSort === "name" ? 1 : -1, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalCustomers = await Customer.countDocuments(filter);

    if (totalCustomers === 0) {
      const error = new Error("No customer found");
      error.statusCode = 200;
      return next(error);
    }

    return sendSuccess(
      res,
      "Customers fetched successfully",
      { customers },
      {
        pagination: {
          page,
          limit,
          total: totalCustomers,
          totalPages: Math.ceil(totalCustomers / limit),
        },
      },
    );
  } catch (error) {
    next(error);
  }
};

const updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isObjectIdOrHexString(id)) {
      const error = new Error("Customer id must be a valid MongoDB ObjectId");
      error.statusCode = 400;
      return next(error);
    }

    const customer = await Customer.findByIdAndUpdate(id, req.body, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!customer) {
      const error = new Error("Customer not found");
      error.statusCode = 200;
      return next(error);
    }

    return sendSuccess(res, "Customer updated successfully", { customer });
  } catch (error) {
    next(error);
  }
};

const updateField = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isObjectIdOrHexString(id)) {
      const error = new Error("Customer id must be a valid MongoDB ObjectId");
      error.statusCode = 400;
      return next(error);
    }

    const allowedFields = ["name", "phone", "email"];
    const update = {};

    for (const field of allowedFields) {
      if (req.body?.[field] !== undefined) {
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

    const customer = await Customer.findByIdAndUpdate(id, update, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!customer) {
      const error = new Error("Customer not found");
      error.statusCode = 200;
      return next(error);
    }

    return sendSuccess(res, "Customer updated successfully", { customer });
  } catch (error) {
    next(error);
  }
};

const deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isObjectIdOrHexString(id)) {
      const error = new Error("Customer id must be a valid MongoDB ObjectId");
      error.statusCode = 400;
      return next(error);
    }

    const customer = await Customer.findByIdAndDelete(id, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!customer) {
      const error = new Error("Customer not found");
      error.statusCode = 200;
      return next(error);
    }

    return sendSuccess(res, "Customer deleted successfully", { customer });
  } catch (error) {
    next(error);
  }
};

export default {
  createCustomer,
  getCustomer,
  updateCustomer,
  updateField,
  deleteCustomer,
};
