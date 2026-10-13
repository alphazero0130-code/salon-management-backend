import mongoose from "mongoose";
import Appointment from "../models/Appointment.js";

const createAppointment = async (req, res, next) => {
  try {
    const { customer, service, price, appointmentDate, status } = req.body;

    const appointment = await Appointment.create({
      customer,
      service,
      price,
      appointmentDate,
      status,
    });

    await appointment.populate([
      { path: "customer", select: "name phone email" },
      { path: "service", select: "serviceName price" },
    ]);

    res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      appointment,
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

const getAppointment = async (req, res, next) => {
  try {
    const id = req.params?.id;
    if (id) {
      if (!mongoose.isObjectIdOrHexString(id)) {
        const error = new Error("Customer id must be a valid MongoDB ObjectId");
        error.statusCode = 400;
        return next(error);
      }
      const appointment = await Appointment.findById(id)
        .populate("customer", "name phone email")
        .populate("service", "serviceName price");

      if (!appointment) {
        const error = new Error("Appointment not found");
        error.statusCode = 404;
        return next(error);
      }

      return res.status(200).json({
        success: true,
        message: "Appointment fetched successfully",
        appointment,
      });
    }
    const { search, status, sortBy } = req.query;
    const filter = {};

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.search = { $regex: escapedSearch, $options: "i" };
    }

    if (status) {
      if (!["booked", "completed", "cancelled"].includes(status)) {
        const error = new Error(
          "Status must be either booked, completed or cancelled",
        );
        error.statusCode = 400;
        return next(error);
      }
      filter.status = status;
    }

    const allowedSortFields = ["name", "createdAt"];
    const selectedSort = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const appointments = await Appointment.find(filter)
      .sort({
        [selectedSort]: selectedSort === "name" ? 1 : -1,
        _id: 1,
      })
      .populate("customer", "name phone email")
      .populate("service", "serviceName price");

    const totalAppointment = await Appointment.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: "Appointment fetched successfully",
      //   page,
      //   limit,
      totalAppointment,
      //   totalPages: Math.ceil(totalCustomers / limit),
      appointments,
    });
  } catch (error) {
    next(error);
  }
};

const updateAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findByIdAndUpdate(id, req.body, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!appointment) {
      const error = new Error("Appointment not found");
      error.statusCode = 404;
      return next(error);
    }
    await appointment.populate([
      { path: "customer", select: "name phone email" },
      { path: "service", select: "serviceName price" },
    ]);

    res.status(200).json({
      success: true,
      message: "Appointment updated successfully",
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

const updateField = async (req, res, next) => {
  try {
    const { id } = req.params;

    const allowedField = ["price", "appointmentDate", "status"];
    const update = {};

    for (const field of allowedField) {
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

    const appointment = await Appointment.findByIdAndUpdate(id, update, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!appointment) {
      const error = new Error("Appointment not found");
      error.statusCode = 404;
      return next(error);
    }

    await appointment.populate([
      { path: "customer", select: "name phone email" },
      { path: "service", select: "serviceName price" },
    ]);

    res.status(200).json({
      success: true,
      message: "Appointment updated successfully",
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

const deleteAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findByIdAndDelete(id, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!appointment) {
      const error = new Error("Appointment not found");
      error.statusCode = 404;
      return next(error);
    }

    await appointment.populate([
      { path: "customer", select: "name phone email" },
      { path: "service", select: "serviceName price" },
    ]);

    res.status(200).json({
      success: true,
      message: "Appointment deleted successfully",
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

const getRevenueSummary = async (req, res, next) => {
  try {
    const summary = await Appointment.aggregate([
      {
        $match: {
          status: "booked",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$price" },
          totalAppointment: { $sum: 1 },
        },
      },
    ]);

    const result = summary[0] || {
      totalRevenue: 0,
      totalAppointment: 0,
    };

    res.status(200).json({
      success: true,
      message: "Revenue fetch successfully",
      revenue: result.totalRevenue,
      completedAppointments: result.totalAppointment,
    });
  } catch (error) {
    next(error);
  }
};

const getRevenueByService = async (req, res, next) => {
  try {
    const report = await Appointment.aggregate([
      {
        $match: {
          status: "completed",
        },
      },
      {
        $group: {
          _id: "$service",
          totalRevenue: { $sum: "$price" },
          totalAppointments: { $sum: 1 },
        },
      },
      {
        $sort: {
          totalRevenue: -1,
        },
      },
    ]);

    const totalRevenue = report.reduce(
      (sum, item) => sum + item.totalRevenue,
      0,
    );

    const totalAppointments = report.reduce(
      (sum, item) => sum + item.totalAppointments,
      0,
    );

    return res.status(200).json({
      success: true,
      message: "Revenue fetched successfully",
      totalRevenue,
      totalAppointments,
      report,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createAppointment,
  getAppointment,
  updateAppointment,
  updateField,
  deleteAppointment,
  getRevenueSummary,
  getRevenueByService,
};
