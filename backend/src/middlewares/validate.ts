import type { Request, RequestHandler } from 'express';
import type { z } from 'zod';

type RequestSource = 'body' | 'query' | 'params';

// Parsed data goes to `req.validated` because Express 5 makes `req.query` read-only.
export function validate(schema: z.ZodType, source: RequestSource): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next(result.error);
      return;
    }

    req.validated = { ...req.validated, [source]: result.data };
    next();
  };
}

// The schema argument only carries the output type; the data was already parsed by `validate`.
export function getValidated<S extends z.ZodType>(
  req: Request,
  source: RequestSource,
  _schema: S,
): z.output<S> {
  const data = req.validated?.[source];
  if (data === undefined) {
    throw new Error(`Request ${source} was not validated; add validate() to the route`);
  }
  return data as z.output<S>;
}
