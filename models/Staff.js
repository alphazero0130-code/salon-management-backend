import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Staff name is required"],
      trim: true,
      minlength: [2, "Staff name must be at least 2 characters long"],
      maxlength: [50, "Staff name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Staff email is required"],
      lowercase: true,
      trim: true,
      unique: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address",
      ],
    },

    jobTitle: {
      type: String,
      required: [true, "Staff job title is required"],
      trim: true,
      minlength: [2, "Job title must be at least 2 characters long"],
      maxlength: [50, "Job title cannot exceed 50 characters"],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Staff = mongoose.model("Staff", staffSchema);

export default Staff;