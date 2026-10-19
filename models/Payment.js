
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: [true, "Appointment is required"],
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      res: "User",
      required: [true, "User detail is required"],
      unique: true
    },
    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: [0, "Payment amount cannot be negative"],
    },

    method: {
      type: String,
      enum: {
        values: ["cash", "card", "upi"],
        message: "Payment method must be cash, card, or UPI",
      },
      required: [true, "Payment method is required"],
    },

    status: {
      type: String,
      enum: {
        values: ["pending", "paid", "refunded"],
        message: "Payment status must be pending, paid, or refunded",
      },
      default: "pending",
    },

    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
