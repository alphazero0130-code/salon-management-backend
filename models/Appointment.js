import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      default: null
    },

    appointmentDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["booked", "completed", "cancelled"],
      default: "booked",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true },
);

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;
