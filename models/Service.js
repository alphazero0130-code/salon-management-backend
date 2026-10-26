import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: [true, "Service Name is required"],
    minlength: [2, "Name must contain at least 2 characters"],
  },
  price: {
    type: Number,
    required: [true, "Service Price is required"],
    min: [0, "Service Price cannot be negative"],
  },
  duration: {
      type: Number,
      required: true,
      min: 1,
    },
   description: {
      type: String,
      trim: true,
      default: "",
    },
   isActive: {
      type: Boolean,
      default: true,
    },
},
{timestamps: true}
);

const Service = mongoose.model("Service", serviceSchema);

export default Service;
