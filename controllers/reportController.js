import Payment from "../models/Payment.js";
import sendSuccess from "../utils/apiResponse.js";

const getRevenueReport = async (req, res, next) => {
  try {
    const report = await Payment.aggregate([
      {
        $match: {
          status: "paid",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
          totalPayment: { $sum: 1 },
        },
      },
      {
        $project: { // Returns only the fields needed by the API: totalRevenue and totalPayment.
          _id: 0,
          totalRevenue: 1,
          totalPayment: 1,
        },
      },
    ]);

    const summary = report[0] ?? {
      totalRevenue: 0,
      totalPayment: 0,
    };

       if (report.length === 0 ) {
        const error = new Error("No report detail found");
        error.statusCode = 200;
        return next(error);
      }

    return sendSuccess(res, "Report fetched successfully", {
      report: summary,
    });
  } catch (error) {
    next(error);
  }
};

export default {getRevenueReport};
