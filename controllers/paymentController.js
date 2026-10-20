import Payment from "../models/Payment.js";
import sendSuccess from "../utils/apiResponse.js";

const getPayment = async (req, res, next) => {
  try {
    const type = req.params.type?.trim();

    const filter = type ? { type } : {};

    const payments = await Payment.find(filter);

    if (payments.length === 0) {
      const error = new Error("Payment detail not found");
      error.statusCode = 200;
      return next(error);
    }

    return sendSuccess(
      res,
      "Payment details fetched successfully",
      payments
    );
  } catch (error) {
    next(error);
  }
};

export default { getPayment };