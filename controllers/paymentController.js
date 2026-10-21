import mongoose from "mongoose";
import Payment from "../models/Payment.js";
import sendSuccess from "../utils/apiResponse.js";

const getPayment = async (req, res, next) => {
  try {
    const type = req.params.type?.trim();

    const filter = type ? { type } : {};

    const payments = await Payment.find(filter);
    const totalPayment = await Payment.countDocuments(filter);

    if(payments.length === 0) {
      const error = new Error("No payment details found");
      error.statusCode = 404;
      return next(error);
    }

    return sendSuccess(
      res,
      "Payment details fetched successfully",
      { totalPayment, payments },
    );
  } catch (error) {
    next(error);
  }
};

const updatePaymentStatus = async (req, res, next) => {
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

    const payment = await Payment.findById(id);
    if (!payment) {
      const error = new Error("Payment not found");
      error.statusCode = 404;
      return next(error);
    }

    payment.status = status;

    if (status === "paid") {
      payment.method = method;
      payment.paidAt = new Date();
    } else {
      payment.paidAt = null;
    }

    await payment.save();

    return sendSuccess(res, "Payment status updated successfully", { payment });
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

export default { getPayment, updatePaymentStatus };