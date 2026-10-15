import mongoose from "mongoose";

const LoginSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      trim: true,
    },
    name: {
      type: String,
      trim: true,
      default: "Rahul",
    },
    role: {
      type: String,
      trim: true,
      enum: ["admin", "staff", "customer"],
      default: "admin",
    },
  },
  { timestamps: true },
);

const Login = mongoose.model("Login", LoginSchema);

export default Login;
