function sendSuccess(res, { data = null, message = 'OK', status = 200, meta } = {}) {
  const body = { success: true, message, data };
  if (meta !== undefined) body.meta = meta;
  return res.status(status).json(body);
}

module.exports = { sendSuccess };
