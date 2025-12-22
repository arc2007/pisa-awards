# syntax=docker/dockerfile:1

########################
# Frontend build stage #
########################
FROM node:20-alpine AS build_front
WORKDIR /app

# Install frontend deps
COPY pisa-proyect/package*.json ./
RUN npm ci

# Build frontend
COPY pisa-proyect/ ./
RUN npm run build


#######################
# Backend build stage #
#######################
FROM node:20-alpine AS build_back
WORKDIR /app/backend

# Native deps for node-gyp builds, plus sqlite libs if needed at build time
RUN apk add --no-cache python3 make g++ sqlite-libs

# Install backend deps (including dev deps for tsc)
COPY pisa-proyect/backend/package*.json ./
RUN npm ci --include=dev

# Copy backend source
COPY pisa-proyect/backend/ ./

# 🔧 Fix: ensure local bin shims (including tsc) are executable
# (prevents: "sh: tsc: Permission denied")
RUN chmod -R a+rx node_modules/.bin \
  && if [ -f node_modules/typescript/bin/tsc ]; then chmod a+rx node_modules/typescript/bin/tsc; fi \
  && npm run build

# Optionally prune dev deps for runtime size
RUN npm prune --omit=dev


#################
# Runtime stage #
#################
FROM node:20-alpine AS runtime
WORKDIR /app

# Runtime sqlite library (you already had this)
RUN apk add --no-cache sqlite-libs

ENV NODE_ENV=production

# Backend runtime files
WORKDIR /app/backend
COPY --from=build_back /app/backend/package*.json ./
COPY --from=build_back /app/backend/node_modules ./node_modules
COPY --from=build_back /app/backend/dist ./dist

# Frontend build output (kept alongside; your backend can serve it if configured)
WORKDIR /app
COPY --from=build_front /app/dist ./dist

# Fly usually expects your app to listen on 8080 (unless your fly.toml says otherwise)
EXPOSE 8080

# Start backend (adjust if your backend start command differs)
WORKDIR /app/backend
CMD ["node", "dist/index.js"]
