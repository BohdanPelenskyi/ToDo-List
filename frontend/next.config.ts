import path from 'node:path';
import type { NextConfig } from 'next';

const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:4000';

// A strict CSP is left out on purpose: Next.js injects inline scripts that would need nonces.
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  output: 'standalone',
  // Linting runs as its own step (npm run lint, CI); the Docker build installs only this workspace.
  eslint: { ignoreDuringBuilds: true },
  poweredByHeader: false,
  // The workspace root must be traced so the standalone build includes hoisted dependencies.
  outputFileTracingRoot: path.join(import.meta.dirname, '..'),
  headers() {
    return Promise.resolve([{ source: '/:path*', headers: securityHeaders }]);
  },
  // Proxying keeps browser requests same-origin, so the auth cookie needs no CORS handling.
  rewrites() {
    return Promise.resolve([{ source: '/api/:path*', destination: `${backendUrl}/api/:path*` }]);
  },
};

export default nextConfig;
