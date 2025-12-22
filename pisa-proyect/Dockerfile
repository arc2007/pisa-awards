# syntax=docker/dockerfile:1

############################
# 1) Build frontend (optional; Angular)
############################
FROM node:20-alpine AS build_front
WORKDIR /src

COPY . .

# Always create an output dir so later COPY --from never fails
RUN mkdir -p /out/public && \
  if [ -f package.json ] && ( [ -f angular.json ] || [ -d src ] ); then \
    npm ci && \
    npm run build && \
    if [ -d dist ]; then cp -R dist/* /out/public/; fi; \
  else \
    echo "No frontend detected in this build context; skipping frontend build."; \
  fi


############################
# 2) Build backend (Node/TS)
############################
FROM node:20-alpine AS build_back
WORKDIR /src

COPY . .

# Detect backend folder (repo root vs ./backend)
# Build, then prune dev deps, then export runtime bundle to /out/backend
RUN set -eux; \
  if [ -f backend/package.json ]; then \
    BACKEND_DIR="backend"; \
  elif [ -f package.json ]; then \
    BACKEND_DIR="."; \
  else \
    echo "ERROR: Could not find backend package.json (neither ./backend/package.json nor ./package.json)"; \
    exit 1; \
  fi; \
  mkdir -p /work/backend && \
  cp -R "$BACKEND_DIR"/. /work/backend/ && \
  cd /work/backend && \
  npm ci --include=dev && \
  npm run build && \
  npm prune --omit=dev && \
  mkdir -p /out/backend && \
  cp -R package*.json node_modules dist /out/backend/


############################
# 3) Runtime
############################
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Copy backend runtime bundle
COPY --from=build_back /out/backend/ ./

# Copy frontend build output (if any) into backend public dir
# (adjust this path in your server if you serve static from somewhere else)
COPY --from=build_front /out/public ./dist/public

EXPOSE 8080

# Start robustly:
# 1) Prefer "npm start" (most reliable if your package.json defines it)
# 2) Otherwise fall back to common dist entry filenames
CMD ["sh", "-lc", "\
  if node -e \"p=require('./package.json');process.exit(p.scripts&&p.scripts.start?0:1)\"; then \
    exec npm start; \
  elif [ -f dist/server.js ]; then \
    exec node dist/server.js; \
  elif [ -f dist/index.js ]; then \
    exec node dist/index.js; \
  elif [ -f dist/main.js ]; then \
    exec node dist/main.js; \
  elif [ -f dist/app.js ]; then \
    exec node dist/app.js; \
  else \
    echo 'ERROR: Could not find an entrypoint in dist/. Contents:'; \
    ls -la dist || true; \
    exit 1; \
  fi \
"]
