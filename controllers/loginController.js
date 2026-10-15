import Customer from "../models/Customer.js";

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const error = new Error("Email and password are required");
      error.statusCode = 400;
      return next(error);
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const customer = await Customer.findOne({ email: normalizedEmail }).select(
      "_id name phone email",
    );

    if (!customer) {
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      return next(error);
    }

    const token = `example-token-${Date.now()}`;

    return res.status(200).json({
      success: true,
      message: "Login successful",
      customer,
    //   user: {
    //     id: customer._id.toString(),
    //     name: customer.name,
    //     phone: customer.phone,
    //     email: customer.email,
    //   },
      token,
    });
  } catch (error) {
    next(error);
  }
};

export default { login };