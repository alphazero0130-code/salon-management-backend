import Appointment from "../models/Appointment.js";
import Payment from "../models/Payment.js";
import Staff from "../models/Staff.js";
import User from "../models/User.js";
import sendSuccess from "../utils/apiResponse.js";

const getDashboardStats = async (req, res, next) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const startOfNextDay = new Date(startOfDay);
    startOfNextDay.setDate(startOfNextDay.getDate() + 1);

    const todayFilter = {
      appointmentDate: { $gte: startOfDay, $lt: startOfNextDay }, // Greater than or equal to, Less than
    };

    const totalCustomers = await User.countDocuments();

    const totalStaff = await Staff.countDocuments();

    const todayAppointments = await Appointment.countDocuments(todayFilter);

    const pendingAppointments = await Appointment.countDocuments({
      ...todayFilter, // spread operator: It copies the date filter into this new object.
      status: "pending",
    });

    // No "confirmed" status in schema; "booked" represents a confirmed booking
    const confirmedAppointments = await Appointment.countDocuments({
      ...todayFilter,
      status: "booked",
    });

    const completedAppointments = await Appointment.countDocuments({
      ...todayFilter,
      status: "completed",
    });

    const revenue = await Payment.aggregate([
      {
        $match: {
          status: "paid",
          paidAt: { $gte: startOfDay, $lt: startOfNextDay },
        },
      },
      {
        $group: {
          _id: null, // combines all matching payments into one result.
          totalRevenue: { $sum: "$amount" },
          totalPayment: { $sum: 1 },
        },
      },
      {
        // selecting which fields you want to keep in the result after MongoDB finishes
        $project: { // Returns only the fields needed by the API: totalRevenue and totalPayment.
          _id: 0, // removes MongoDB's default _id field.
          totalRevenue: 1, // keeps the revenue field.
          totalPayment: 1, // keeps the payment count.
        },
      },
    ]);

    if (totalCustomers === 0 && totalStaff === 0 && todayAppointments === 0) {
      const error = new Error("No dashboard data found");
      error.statusCode = 200;
      return next(error);
    }

    const result = revenue[0] || { totalRevenue: 0 };

    return sendSuccess(res, "Dashboard statistics fetched successfully", {
      totalCustomers,
      totalStaff,
      todayAppointments,
      pendingAppointments,
      confirmedAppointments,
      completedAppointments,
      todayRevenue: result.totalRevenue,
    });
  } catch (error) {
    next(error);
  }
};

export default { getDashboardStats };
