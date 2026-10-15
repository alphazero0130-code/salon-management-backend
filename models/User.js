import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true, // MongoDB creates a unique index so duplicate emails cannot be stored. It is not a replacement for checking duplicate emails in our controller.
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // the password hash is excluded from normal Mongoose queries by default.
    },
    role: {
      type: String,
      enum: ["admin", "staff"],
      default: "staff",
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);

export default User;
