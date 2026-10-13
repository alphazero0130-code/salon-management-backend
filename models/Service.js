import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
  serviceName: {
    type: String,
    trim: true,
    require: [true, "Service Name is required"],
    minlength: [2, "Name must contain at least 2 characters"],
  },
  price: {
    type: Number,
    require: [true, "Service Price is required"],
  },
  status: {
    type: String,
    enum: {
      values: ["active", "inactive"],
      message: "Status must be either active or inactive",
    },
    default: "active",
  },
},
{timestamps: true}
);

const Service = mongoose.model("Service", serviceSchema);

export default serviceSchema;
