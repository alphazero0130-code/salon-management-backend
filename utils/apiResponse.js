const sendSuccess = (
  res,
  message,
  data,
  { status = 200, pagination = null } = {},
) => {
  const response = {
    success: true,
    message,
    data,
  };

  if (pagination !== null) {
    response.pagination = pagination;
  }

  return res.status(status).json(response);
};

export default sendSuccess;
