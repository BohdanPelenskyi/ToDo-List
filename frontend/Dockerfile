FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/

FROM base AS build
ARG BACKEND_URL=http://backend:4000
ENV BACKEND_URL=$BACKEND_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm ci -w frontend
COPY frontend frontend
RUN npm run build -w frontend

FROM node:20-alpine AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
WORKDIR /app
COPY --from=build /app/frontend/.next/standalone ./
COPY --from=build /app/frontend/.next/static frontend/.next/static
# The standalone output does not include public/, which holds the photos.
COPY --from=build /app/frontend/public frontend/public
USER node
EXPOSE 3000
CMD ["node", "frontend/server.js"]
