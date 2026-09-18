const { z } = require('zod');
const ApiError = require('../utils/ApiError');

function validate({ body, params, query }) {
  return (req, res, next) => {
    try {
      if (body) req.body = body.parse(req.body);
      if (params) req.params = params.parse(req.params);
      if (query) req.query = query.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const issues = error.issues || error.errors || [];
        const first = issues[0]?.message || 'Validation failed';
        return next(
          new ApiError(
            400,
            first,
            issues.map((item) => ({
              path: Array.isArray(item.path) ? item.path.join('.') : String(item.path || ''),
              message: item.message,
            }))
          )
        );
      }
      next(error);
    }
  };
}

const idParam = z.object({ id: z.string().uuid() });

module.exports = { validate, idParam };
