const errorHandler = async (err, req, res, next) => {
  console.error(err.stack);

  const respose = {
    success: false,
    message: err.message || "Internal Server Error",
  };

  if (err.errors) {
    respose.errors = err.errors;
  }

  res.status(err.statusCode || 500).json(respose);
};

export default errorHandler;
