
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      trim: true,
      required: [true, "Payment type is required"],
      default: "appointment",
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: [true, "Appointment is required"],
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User detail is required"],
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
      required: function () {
        return this.status === "paid";
      },
    },

    status: {
      type: String,
      enum: {
        values: ["pending", "paid", "failed", "refunded"],
        message: "Payment status must be pending, paid, failed, or refunded",
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
