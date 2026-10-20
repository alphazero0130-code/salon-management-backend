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

export default { getPayment };