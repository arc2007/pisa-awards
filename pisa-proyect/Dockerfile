# ---- 1) Build frontend (Angular) ----
FROM node:20-alpine AS build_front
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- 2) Build backend (Node/TS) ----
FROM node:20-alpine AS build_back
WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci --include=dev

COPY backend/ .
RUN npm run build
RUN npm prune --omit=dev

# ---- 3) Runtime ----
FROM node:20-alpine AS runtime
WORKDIR /app/backend
ENV NODE_ENV=production

# backend build output + prod deps
COPY --from=build_back /app/backend/dist ./dist
COPY --from=build_back /app/backend/node_modules ./node_modules
COPY --from=build_back /app/backend/package*.json ./

# frontend build output -> backend public folder (matches your server.ts)
COPY --from=build_front /app/dist ./dist/public

EXPOSE 8080
CMD ["node", "dist/server.js"]
