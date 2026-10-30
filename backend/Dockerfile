FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/

FROM base AS build
RUN npm ci -w backend
COPY backend backend
RUN npm run build -w backend

FROM base AS prod-deps
RUN npm ci -w backend --omit=dev

FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=prod-deps /app/node_modules node_modules
COPY --from=build /app/backend/dist backend/dist
COPY backend/package.json backend/.sequelizerc backend/
COPY backend/db backend/db
WORKDIR /app/backend
USER node
EXPOSE 4000
# Migrations are idempotent, so applying them on every start keeps the schema current.
CMD ["sh", "-c", "npx --no-install sequelize-cli db:migrate && node dist/server.js"]
