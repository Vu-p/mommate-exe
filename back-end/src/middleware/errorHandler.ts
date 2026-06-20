import type { ErrorRequestHandler, RequestHandler } from 'express';

export const notFound: RequestHandler = (req, res) =>
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.originalUrl} not found` } });

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const status = Number(error.status || error.statusCode || 500);
  res.status(status).json({
    error: {
      code: error.code || (status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR'),
      message: status >= 500 && process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
      details: error.details,
    },
  });
};
