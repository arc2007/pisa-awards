# ---- 1) Frontend build (Angular, optional) ----
FROM node:20-alpine AS build_front
WORKDIR /src

# Copy everything first (simple + works with Fly builders)
COPY . .

# Always create output folder so runtime COPY never fails
RUN mkdir -p /out/public && \
    if [ -f package.json ] && ( [ -f angular.json ] || [ -d src ] ); then \
      npm ci && \
      npm run build && \
      if [ -d dist ]; then cp -R dist/* /out/public/; fi; \
    else \
      echo "No Angular frontend detected; skipping frontend build."; \
    fi


# ---- 2) Backend build (Node/TS) ----
FROM node:20-alpine AS build_back
WORKDIR /src

COPY . .

# Hard fail if backend isn't present in build context (this catches .dockerignore / wrong root dir)
RUN test -f backend/package.json || (echo "ERROR: backend/package.json not found in build context. Check Fly root dir and .dockerignore." && exit 1)

WORKDIR /src/backend

# Install deps + build
ENV NODE_ENV=development
RUN npm ci --include=dev && npm run build

# Keep only production deps for runtime
RUN npm prune --omit=dev

# Collect runtime bundle
RUN mkdir -p /out/backend && \
    cp -R dist node_modules package*.json /out/backend/


# ---- 3) Runtime ----
FROM node:20-alpine AS runtime
WORKDIR /app/backend
ENV NODE_ENV=production

# If you mount a Fly volume at /data, set SQLITE_DIR=/data in fly.toml
# ENV SQLITE_DIR=/data

# Copy backend bundle
COPY --from=build_back /out/backend/ ./

# Copy frontend output (if any) into where your compiled server expects it:
# server.ts uses: path.join(__dirname, "public") and __dirname will be /app/backend/dist
RUN mkdir -p dist/public
COPY --from=build_front /out/public/ ./dist/public/

EXPOSE 8080

# Robust start: try common TS build outputs
CMD ["sh", "-c", "node dist/server.js || node dist/backend/server.js || node dist/src/server.js"]
