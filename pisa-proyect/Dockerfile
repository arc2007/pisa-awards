# syntax=docker/dockerfile:1

# ---- 1) Build frontend (Angular) ----
FROM node:20-alpine AS build_front
WORKDIR /app

# If Angular build needs native deps, uncomment the next line:
# RUN apk add --no-cache python3 make g++ git

# Install deps from the app folder inside the repo
COPY pisa-proyect/package*.json ./
RUN npm ci

# Copy the rest of the Angular app
COPY pisa-proyect/ ./

# Build Angular -> dist/...
RUN npm run build

# Collect frontend output in a stable location
RUN mkdir -p /out/public && \
    if [ -d dist ]; then cp -R dist/* /out/public/; fi


# ---- 2) Build backend (Node/TS) ----
FROM node:20-alpine AS build_back
WORKDIR /app/backend

# Needed for sqlite3 native module builds on Alpine
RUN apk add --no-cache python3 make g++ sqlite-libs

COPY pisa-proyect/backend/package*.json ./
RUN npm ci --include=dev

COPY pisa-proyect/backend/ ./

# Build TS -> dist/...
RUN npm run build

# Keep only production deps for runtime, then stage output
RUN npm prune --omit=dev && \
    mkdir -p /out/backend && \
    cp -R dist node_modules package*.json /out/backend/


# ---- 3) Runtime ----
FROM node:20-alpine AS runtime
WORKDIR /app/backend
ENV NODE_ENV=production

# sqlite runtime libs
RUN apk add --no-cache sqlite-libs

# Backend runtime bundle (dist + prod node_modules)
COPY --from=build_back /out/backend/ ./

# Your server.ts serves static files from:
#   const publicDir = path.join(__dirname, "public");
# and __dirname will be /app/backend/dist at runtime,
# so we must copy Angular into /app/backend/dist/public
COPY --from=build_front /out/public/ ./dist/public/

EXPOSE 8080
CMD ["node", "dist/server.js"]
