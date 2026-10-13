import mongoose from "mongoose";
import Service from "../models/Service.js";

const createService = async (req, res, next) => {
  try {
    const { serviceName, price, status } = req.body;

    const service = await Service.create({
      serviceName,
      price,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Service added Successfully",
      service,
    });
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

const getServices = async (req, res, next) => {
  try {
    const id = req.params.id?.trim();
    if (id) {
      if (!mongoose.isObjectIdOrHexString(id)) {
        const error = new Error("Service id must be a valid MongoDB ObjectId");
        error.statusCode = 400;
        return next(error);
      }
      const service = await Service.findById(id);

      if (!service) {
        const error = new Error("Service not found");
        error.statusCode = 404;
        return next(error);
      }

      return res.status(200).json({
        success: true,
        message: "Service fetched successfully",
        service,
      });
    }

    const { search, status, sortBy } = req.query;
    const filter = {};

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.name = { $regex: escapedSearch, $options: "i" };
    }

    if (status) {
      const allowedStatus = ["active", "inactive"];
      if (!allowedStatus.includes(status)) {
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

    const services = await Service.find(filter).sort({
      [selectedSort]: selectedSort === "name" ? 1 : -1,
      _id: 1,
    });

    const totalServices = await Service.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: "Services fetched successfully",
      //   page,
      //   limit,
      totalServices,
      //   totalPages: Math.ceil(totalCustomers / limit),
      services,
    });
  } catch (error) {
    next(error);
  }
};

const updateService = async (req, res, next) => {
  try {
    const { id } = req.params;

    const service = await Service.findByIdAndUpdate(id, req.body, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!service) {
      const error = new Error("Service not found");
      error.statusCode = 404;
      return next(error);
    }
    res.status(200).json({
      success: true,
      message: "Service updated successfully",
      service,
    });
  } catch (error) {
    next(error);
  }
};

const updateField = async (req, res, next) => {
  try {
    const { id } = req.params;
    const allowedField = ["serviceName", "price", "status"];
    const update = {};

    for (const field of allowedField) {
      if (req.body?.[field] != undefined) {
        update[field] = req.body?.[field];
      }
    }

    if (Object.keys(update).length === 0) {
      const error = new Error(
        "Please provide at least one valid field to update",
      );
      error.statusCode = 400;
      return next(error);
    }

    const service = await Service.findByIdAndUpdate(id, update, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!service) {
      const error = new Error("Service not found");
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      message: "Service updated successfully",
      service,
    });
  } catch (error) {
    next(error);
  }
};

const deleteService = async (req, res, next) => {
  try {
    const { id } = req.params;

    const service = await Service.findByIdAndDelete(id, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!service) {
      const error = new Error("Service not found");
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      message: "Service deleted successfully",
      service,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createService,
  getServices,
  updateService,
  updateField,
  deleteService,
};
