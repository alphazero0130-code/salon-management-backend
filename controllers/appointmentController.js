import mongoose from "mongoose";
import Appointment from "../models/Appointment.js";
import Service from "../models/Service.js";
import Payment from "../models/Payment.js";
import sendSuccess from "../utils/apiResponse.js";

const createAppointment = async (req, res, next) => {
  try {
    const { userId, serviceId, staffId, appointmentDate, notes } = req.body;

    if (!mongoose.isObjectIdOrHexString(userId)) {
      const error = new Error("userId must be a valid MongoDB ObjectId");
      error.statusCode = 400;
      return next(error);
    }

    if (!mongoose.isObjectIdOrHexString(serviceId)) {
      const error = new Error("serviceId must be a valid MongoDB ObjectId");
      error.statusCode = 400;
      return next(error);
    }

    if (staffId !== undefined && staffId !== null && !mongoose.isObjectIdOrHexString(staffId)) {
      const error = new Error("staffId must be a valid MongoDB ObjectId");
      error.statusCode = 400;
      return next(error);
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      const error = new Error("Service not found");
      error.statusCode = 404;
      return next(error);
    }

    const appointment = await Appointment.create({
      user: userId,
      service: serviceId,
      staff: staffId,
      appointmentDate,
      notes,
    });

    const payment = await Payment.create({
      type: "appointments",
      itemId: appointment._id,
      itemModel: "Appointment",
      user: userId,
      amount: service.price,
      status: "pending",
    });

    await appointment.populate([
      { path: "user", select: "name phone email" },
      { path: "service", select: "name price" },
      { path: "staff", select: "name jobTitle" },
    ]);

    return sendSuccess(
      res,
      "Appointment created successfully",
      { appointment, payment },
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

// const getPayment = async (req, res, next) => {
//   try {
//     const payments = await Payment.find();
  
//     return sendSuccess(res, "Payment fetched successfully", payments);
//   } catch (error) {
//     next(error);
//   }
// };

const getAppointment = async (req, res, next) => {
  try {
    const id = req.params?.id;
    if (id) {
      if (!mongoose.isObjectIdOrHexString(id)) {
        const error = new Error(
          "Appointment id must be a valid MongoDB ObjectId",
        );
        error.statusCode = 400;
        return next(error);
      }
      const appointment = await Appointment.findById(id)
        .populate("user", "name phone email")
        .populate("service", "name price")
        .populate("staff", "name jobTitle");

      if (!appointment) {
        const error = new Error("No appointment detail found");
        error.statusCode = 200;
        return next(error);
      }

      return sendSuccess(res, "Appointment fetched successfully", {
        appointment,
      });
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
      filter.notes = { $regex: escapedSearch, $options: "i" };
    }

    if (status) {
      if (!["booked", "completed", "cancelled", "pending"].includes(status)) {
        const error = new Error(
          "Status must be either booked, completed, cancelled or pending",
        );
        error.statusCode = 400;
        return next(error);
      }
      filter.status = status;
    }

    const allowedSortFields = ["createdAt", "appointmentDate", "status"];
    const selectedSort = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const appointments = await Appointment.find(filter)
      .sort({
        [selectedSort]: -1,
        _id: 1,
      }).skip((page - 1) * limit)
      .limit(limit)
      .populate("user", "name phone email")
      .populate("service", "name price")
      .populate("staff", "name jobTitle");

    const totalAppointment = await Appointment.countDocuments(filter);

    if (totalAppointment === 0) {
      const error = new Error("No appointment found");
      error.statusCode = 200;
      return next(error);
    }

    return sendSuccess(
      res,
      "Appointment fetched successfully",
      { appointments },
      {
        pagination: {
          page,
          limit,
          total: totalAppointment,
          totalPages: Math.ceil(totalAppointment / limit),
        },
      },
    );
  } catch (error) {
    next(error);
  }
};

const updateAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isObjectIdOrHexString(id)) {
      const error = new Error("Appointment id must be a valid MongoDB ObjectId");
      error.statusCode = 400;
      return next(error);
    }

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
      { path: "user", select: "name phone email" },
      { path: "service", select: "name price" },
      { path: "staff", select: "name jobTitle" },
    ]);

    return sendSuccess(res, "Appointment updated successfully", {
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

const updateField = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isObjectIdOrHexString(id)) {
      const error = new Error("Appointment id must be a valid MongoDB ObjectId");
      error.statusCode = 400;
      return next(error);
    }

    const allowedField = ["appointmentDate", "status", "notes"];
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
      { path: "user", select: "name phone email" },
      { path: "service", select: "name price" },
      { path: "staff", select: "name jobTitle" },
    ]);

    return sendSuccess(res, "Appointment updated successfully", {
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

const deleteAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isObjectIdOrHexString(id)) {
      const error = new Error("Appointment id must be a valid MongoDB ObjectId");
      error.statusCode = 400;
      return next(error);
    }

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
      { path: "user", select: "name phone email" },
      { path: "service", select: "name price" },
      { path: "staff", select: "name jobTitle" },
    ]);

    return sendSuccess(res, "Appointment deleted successfully", {
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
          status: "completed",
        },
      },
      {
        $lookup: {
          from: Service.collection.name,
          localField: "service",
          foreignField: "_id",
          as: "service",
        },
      },
      { $unwind: "$service" },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$service.price" },
          totalAppointment: { $sum: 1 },
        },
      },
    ]);

    const result = summary[0] || {
      totalRevenue: 0,
      totalAppointment: 0,
    };

    return sendSuccess(res, "Revenue fetched successfully", {
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
        $lookup: {
          from: Service.collection.name,
          localField: "service",
          foreignField: "_id",
          as: "serviceDetails",
        },
      },
      { $unwind: "$serviceDetails" },
      {
        $group: {
          _id: "$service",
          totalRevenue: { $sum: "$serviceDetails.price" },
          totalAppointments: { $sum: 1 },
        },
      },
      {
        $sort: {
          totalRevenue: -1,
        },
      },
    ]);

    if (report.length === 0) {
      const error = new Error("No revenue data found");
      error.statusCode = 200;
      return next(error);
    }

    const totalRevenue = report.reduce(
      (sum, item) => sum + item.totalRevenue,
      0,
    );

    const totalAppointments = report.reduce(
      (sum, item) => sum + item.totalAppointments,
      0,
    );

    return sendSuccess(res, "Revenue fetched successfully", {
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
