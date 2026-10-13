import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      require: true,
    },
    serviceName: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      require: true,
    },

    price: {
      type: Number,
      require: true,
      min: 0,
    },

    appointmentDate: {
      type: Date,
      require: true,
    },

    status: {
      type: String,
      enum: ["booked", "completed", "cancelled"],
      default: "booked",
    },
  },
  { timestamps: true },
);

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;
