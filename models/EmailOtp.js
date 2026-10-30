import mongoose from "mongoose";

const emailOtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    purpose: {
      type: String,
      required: true,
      enum: ["registration", "password-reset"],
    },

    otpHash: {
      type: String,
      required: true,
      select: false, // Mongoose hides this field by default (don’t include this field by default when reading it from the database)
    },

    attempts: {
      type: Number,
      default: 0,
    },

    expiresAt: {
      type: Date,
      required: true,
      expires: 0,
    },
  },
  { timestamps: true },
);

emailOtpSchema.index({ email: 1, purpose: 1 }); // creates a compound index in MongoDB on the email and purpose fields.(it helps MongoDB find the correct OTP record faster.)

const EmailOtp = mongoose.model("EmailOtp", emailOtpSchema);

export default EmailOtp;