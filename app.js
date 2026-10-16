import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import errorHandler from "./middleware/errorHandler.js";
import customerRoutes from "./routes/customerRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import loginRoutes from "./routes/loginRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";

const app = express();
app.use(helmet());
app.use(express.json({ limit: "100kb" }));

app.use((req, res, next) => {
  console.log(`Route: ${req.method} ${req.originalUrl}`);
  next();
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many request. Please try again later.",
  },
});

app.use(apiLimiter);

//Register APIs Routes
app.use("/api", loginRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/appointments", appointmentRoutes);



app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);

// app.use(
//   "/api-docs",
//   swaggerUi.serve,
//   swaggerUi.setup(swaggerSpec)
// );

// Handle unknown endpoints
app.use((req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// Handle errors from routes and middleware
app.use(errorHandler);

export default app;
