import type { ErrorRequestHandler } from 'express';
import { z } from 'zod';
import { env } from '../config/env';
import { AppError } from '../utils/app-error';

interface ErrorBody {
  error: { code: string; message: string; details?: unknown };
}

// body-parser errors carry a machine-readable `type` instead of an HTTP-friendly class.
const BODY_PARSER_ERRORS: Record<string, AppError> = {
  'entity.parse.failed': AppError.badRequest('Request body is not valid JSON'),
  'entity.too.large': new AppError(413, 'PAYLOAD_TOO_LARGE', 'Request body is too large'),
};

function toAppError(err: unknown): AppError | undefined {
  if (err instanceof AppError) return err;

  if (err instanceof z.ZodError) {
    return new AppError(400, 'VALIDATION_ERROR', 'Validation failed', z.flattenError(err));
  }

  if (err instanceof Error && 'type' in err && typeof err.type === 'string') {
    return BODY_PARSER_ERRORS[err.type];
  }

  return undefined;
}

function toBody({ code, message, details }: AppError): ErrorBody {
  return { error: { code, message, ...(details !== undefined && { details }) } };
}

export const errorHandler: ErrorRequestHandler = (err: unknown, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const appError = toAppError(err);
  if (appError) {
    res.status(appError.statusCode).json(toBody(appError));
    return;
  }

  req.log.error({ err }, 'Unhandled error');

  const exposeDetails = env.NODE_ENV !== 'production' && err instanceof Error;
  const internalError = new AppError(
    500,
    'INTERNAL_ERROR',
    exposeDetails ? err.message : 'Internal server error',
    exposeDetails ? err.stack : undefined,
  );
  res.status(internalError.statusCode).json(toBody(internalError));
};
