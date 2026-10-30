import { setupServer } from 'msw/node';

// Tests add their own handlers with server.use(...); nothing is mocked by default.
export const server = setupServer();
