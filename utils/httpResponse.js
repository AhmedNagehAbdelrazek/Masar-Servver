function successResponse(res, data, statusCode = 200) {
  return res.status(statusCode).json(data);
}

function paginatedResponse(res, data, meta) {
  return res.status(200).json({
    data,
    meta,
  });
}

module.exports = { successResponse, paginatedResponse };
