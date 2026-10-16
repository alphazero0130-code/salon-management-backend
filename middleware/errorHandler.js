const errorHandler = async (err, req, res, next) => {
  console.error(err.stack);

  const response = {
    success: false,
    message: err.message || "Internal Server Error",
  };

  if (err.errors != null) {
    response.errors = err.errors;
  }

  res.status(err.statusCode || 500).json(response);
};

export default errorHandler;
