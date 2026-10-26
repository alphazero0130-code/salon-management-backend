import mongoose from "mongoose";
import Payment from "../models/Payment.js";
import Appointment from "../models/Appointment.js";
import sendSuccess from "../utils/apiResponse.js";

const getPayment = async (req, res, next) => {
  try {
    const type = req.params.type?.trim();

    const filter = type ? { type } : {};
    
     const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);

    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10),
    );

    const payments = await Payment.find(filter)
      .sort({ createdAt: -1, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalPayment = await Payment.countDocuments(filter);

    if (totalPayment === 0) {
      const error = new Error("No payment found");
      error.statusCode = 200;
      return next(error);
    }

    return sendSuccess(
      res,
      "Payment details fetched successfully",
      { payments },
      {
        pagination: {
          page,
          limit,
          total: totalPayment,
          totalPages: Math.ceil(totalPayment / limit),
        },
      },
    );
  } catch (error) {
    next(error);
  }
};

const updatePaymentStatus = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const { id } = req.params;

    if (!mongoose.isObjectIdOrHexString(id)) {
      const error = new Error("Payment id must be a valid MongoDB ObjectId");
      error.statusCode = 400;
      return next(error);
    }

    const { status, method } = req.body;

    const allowedStatus = ["pending", "paid", "failed", "refunded"];
    if (!status || !allowedStatus.includes(status)) {
      const error = new Error(  
        "Status must be pending, paid, failed, or refunded",
      );
      error.statusCode = 400;
      return next(error);
    }

    // A payment can only move to "paid" with a valid method, so validate the
    // method before touching the payment status.
    if (status === "paid") {
      const allowedMethods = ["cash", "card", "upi"];
      if (!method || !allowedMethods.includes(method)) {
        const error = new Error("Payment method must be cash, card, or upi");
        error.statusCode = 400;
        return next(error);
      }

      // The client request is not proof that an online payment succeeded.
      // Online methods must be confirmed by the payment gateway, so only cash
      // can be settled manually through this endpoint.
      if (method !== "cash") {
        const error = new Error(
          "Online payments must be confirmed by the payment gateway and cannot be marked paid manually",
        );
        error.statusCode = 400;
        return next(error);
      }
    }

    // Update the authoritative Payment record and the linked Appointment's
    // payment summary in one transaction so the two can never partially
    // succeed and disagree.
    let payment = null;
    let appointment = null;

    await session.withTransaction(async () => {
      payment = await Payment.findById(id).session(session);
      if (!payment) {
        const error = new Error("Payment not found");
        error.statusCode = 200;
        throw error;
      }

      payment.status = status;

      if (status === "paid") {
        payment.method = method;
        payment.paidAt = new Date();
      } else {
        payment.paidAt = null;
      }

      await payment.save({ session });

      if (payment.itemModel === "Appointment") {
        appointment = await Appointment.findByIdAndUpdate(
          payment.itemId,
          { payment: status },
          { returnDocument: "after", runValidators: true, session },
        );
      }
    });

    return sendSuccess(res, "Payment status updated successfully", {
      payment,
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
  } finally {
    session.endSession();
  }
};

export default { getPayment, updatePaymentStatus };