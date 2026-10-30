declare module 'express-serve-static-core' {
  interface Request {
    /** Set by `requireAuth`; read it through `getAuthenticatedUserId`. */
    userId?: string;
    /** Set by `validate`; read it through `getValidated`. */
    validated?: Partial<Record<'body' | 'query' | 'params', unknown>>;
  }
}

export {};
