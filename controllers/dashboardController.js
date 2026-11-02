import mongoose from "mongoose";
import Appointment from "../models/Appointment.js";
import Payment from "../models/Payment.js";
import Staff from "../models/Staff.js";
import Customer from "../models/Customer.js";
import sendSuccess from "../utils/apiResponse.js";

// Profiles store a single `name`; the dashboard wants first/last.
// Split on whitespace: first word is the first name, the rest is the last name.
const splitName = (fullName) => {
  const parts = (fullName || "").trim().split(/\s+/).filter(Boolean);
  const firstName = parts.shift() || "";
  const lastName = parts.join(" ");
  return { firstName, lastName };
};

// appointmentDate is a Date; split it into "YYYY-MM-DD" and "HH:MM" (UTC).
const formatDate = (date) => (date ? date.toISOString().slice(0, 10) : null);
const formatTime = (date) => (date ? date.toISOString().slice(11, 16) : null);

// Shape a populated appointment into the compact form the dashboard returns.
const mapAppointment = (appointment, amountByAppointment) => {
  const service = appointment.service;
  const staff = appointment.staff;
  const amount =
    amountByAppointment.get(String(appointment._id)) ?? service?.price ?? 0;

  return {
    appointmentId: appointment._id,
    serviceName: service?.name ?? null,
    date: formatDate(appointment.appointmentDate),
    time: formatTime(appointment.appointmentDate),
    staffName: staff?.name ?? null,
    status: appointment.status,
    amount,
  };
};

// Placeholder sections — no data model exists for these yet. They return stable
// defaults so every role's response has the same shape; wire up real data later.
const placeholderSections = () => ({
  rewards: { availablePoints: 0 },
  coupons: { availableCount: 0 },
  membership: null,
  notifications: { unreadCount: 0 },
});

// Given the newest appointment to show (next + recent), fetch their paid amounts
// in one query and return a lookup map keyed by appointment id.
const amountMapFor = async (appointments) => {
  const ids = appointments.filter(Boolean).map((item) => item._id);
  const payments = ids.length
    ? await Payment.find({ itemId: { $in: ids } }).select("itemId amount")
    : [];

  const map = new Map();
  for (const payment of payments) {
    map.set(String(payment.itemId), payment.amount);
  }
  return map;
};

// Build the appointment-based part of a personal dashboard (customer or staff)
// from a base filter that scopes appointments to that person.
const buildAppointmentSection = async (baseFilter) => {
  const now = new Date();
  const upcomingMatch = {
    ...baseFilter,
    appointmentDate: { $gte: now },
    status: { $in: ["booked", "pending"] },
  };

  const [
    totalAppointments,
    completedAppointments,
    upcomingAppointments,
    cancelledAppointments,
    nextAppointmentDoc,
    recentAppointmentDocs,
  ] = await Promise.all([
    Appointment.countDocuments(baseFilter),
    Appointment.countDocuments({ ...baseFilter, status: "completed" }),
    Appointment.countDocuments(upcomingMatch),
    Appointment.countDocuments({ ...baseFilter, status: "cancelled" }),
    Appointment.findOne(upcomingMatch)
      .sort({ appointmentDate: 1 })
      .populate("service", "name price")
      .populate("staff", "name"),
    Appointment.find({ ...baseFilter, appointmentDate: { $lt: now } })
      .sort({ appointmentDate: -1 })
      .limit(5)
      .populate("service", "name price")
      .populate("staff", "name"),
  ]);

  const amountByAppointment = await amountMapFor([
    nextAppointmentDoc,
    ...recentAppointmentDocs,
  ]);

  return {
    statistics: {
      totalAppointments,
      completedAppointments,
      upcomingAppointments,
      cancelledAppointments,
    },
    nextAppointment: nextAppointmentDoc
      ? mapAppointment(nextAppointmentDoc, amountByAppointment)
      : null,
    recentAppointments: recentAppointmentDocs.map((item) =>
      mapAppointment(item, amountByAppointment),
    ),
  };
};

// --- Admin: a system-wide overview ---------------------------------------
const buildAdminDashboard = async (userId) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const startOfNextDay = new Date(startOfDay);
  startOfNextDay.setDate(startOfNextDay.getDate() + 1);

  const todayFilter = {
    appointmentDate: { $gte: startOfDay, $lt: startOfNextDay },
  };

  const now = new Date();
  const upcomingMatch = {
    appointmentDate: { $gte: now },
    status: { $in: ["booked", "pending"] },
  };

  const [
    totalCustomers,
    totalStaff,
    todayAppointments,
    pendingAppointments,
    confirmedAppointments,
    completedAppointments,
    revenueAgg,
    nextAppointmentDoc,
    recentAppointmentDocs,
    adminProfile,
  ] = await Promise.all([
    // Customers live in the Customer collection; the User collection only holds
    // admin/staff accounts, so it must not be used for the customer count.
    Customer.countDocuments(),
    Staff.countDocuments(),
    Appointment.countDocuments(todayFilter),
    Appointment.countDocuments({ ...todayFilter, status: "pending" }),
    // No "confirmed" status in schema; "booked" represents a confirmed booking.
    Appointment.countDocuments({ ...todayFilter, status: "booked" }),
    Appointment.countDocuments({ ...todayFilter, status: "completed" }),
    Payment.aggregate([
      {
        $match: {
          status: "paid",
          paidAt: { $gte: startOfDay, $lt: startOfNextDay },
        },
      },
      { $group: { _id: null, totalRevenue: { $sum: "$amount" } } },
    ]),
    Appointment.findOne(upcomingMatch)
      .sort({ appointmentDate: 1 })
      .populate("service", "name price")
      .populate("staff", "name"),
    Appointment.find({ appointmentDate: { $lt: now } })
      .sort({ appointmentDate: -1 })
      .limit(5)
      .populate("service", "name price")
      .populate("staff", "name"),
    // Admin accounts are created through the staff API, so their profile lives in Staff.
    Staff.findOne({ user: userId }),
  ]);

  const amountByAppointment = await amountMapFor([
    nextAppointmentDoc,
    ...recentAppointmentDocs,
  ]);

  const { firstName, lastName } = splitName(adminProfile?.name);

  return {
    profile: {
      id: adminProfile?._id ?? userId,
      firstName,
      lastName,
      email: adminProfile?.email ?? null,
      jobTitle: adminProfile?.jobTitle ?? null,
      profileImage: null,
    },
    statistics: {
      totalCustomers,
      totalStaff,
      todayAppointments,
      pendingAppointments,
      confirmedAppointments,
      completedAppointments,
      todayRevenue: revenueAgg[0]?.totalRevenue ?? 0,
    },
    nextAppointment: nextAppointmentDoc
      ? mapAppointment(nextAppointmentDoc, amountByAppointment)
      : null,
    recentAppointments: recentAppointmentDocs.map((item) =>
      mapAppointment(item, amountByAppointment),
    ),
    ...placeholderSections(),
  };
};

// --- Staff: their own assigned appointments ------------------------------
const buildStaffDashboard = async (userId) => {
  const staff = await Staff.findOne({ user: userId });

  if (!staff) {
    const error = new Error("Staff profile not found");
    error.statusCode = 404;
    throw error;
  }

  const section = await buildAppointmentSection({ staff: staff._id });
  const { firstName, lastName } = splitName(staff.name);

  return {
    profile: {
      id: staff._id,
      firstName,
      lastName,
      email: staff.email,
      jobTitle: staff.jobTitle,
      profileImage: null,
    },
    ...section,
    ...placeholderSections(),
  };
};

// --- Customer: their own bookings and spend ------------------------------
const buildCustomerDashboard = async (userId) => {
  const customer = await Customer.findOne({ user: userId });

  if (!customer) {
    const error = new Error("Customer profile not found");
    error.statusCode = 404;
    throw error;
  }

  const section = await buildAppointmentSection({ user: userId });

  // Total spent is specific to the customer view.
  const spentAgg = await Payment.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        status: "paid",
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  section.statistics.totalSpent = spentAgg[0]?.total ?? 0;

  const { firstName, lastName } = splitName(customer.name);

  return {
    profile: {
      id: customer._id,
      firstName,
      lastName,
      email: customer.email,
      phone: customer.phone,
      profileImage: null,
    },
    ...section,
    ...placeholderSections(),
  };
};

// Single dashboard endpoint for every role. The response has the same structure
// for all roles, with a `role` field and role-appropriate `statistics`.
const getDashboard = async (req, res, next) => {
  try {
    const role = req.user.role;
    let dashboard;

    if (role === "admin") {
      dashboard = await buildAdminDashboard(req.user.id);
    } else if (role === "staff") {
      dashboard = await buildStaffDashboard(req.user.id);
    } else if (role === "customer") {
      dashboard = await buildCustomerDashboard(req.user.id);
    } else {
      const error = new Error("No dashboard available for this role");
      error.statusCode = 403;
      return next(error);
    }

    return sendSuccess(res, "Dashboard fetched successfully", {
      role,
      ...dashboard,
    });
  } catch (error) {
    next(error);
  }
};

export default { getDashboard };
