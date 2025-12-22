# syntax=docker/dockerfile:1

# ---------- Base (build deps for native modules like sqlite3) ----------
FROM node:20-alpine AS base
RUN apk add --no-cache python3 make g++


# ---------- 1) Frontend build (optional; Angular) ----------
FROM base AS build_front
WORKDIR /src
COPY . .

# Always create output dir so runtime COPY never fails
RUN set -eux; \
    mkdir -p /out/public; \
    if [ -f package.json ] && ( [ -f angular.json ] || [ -d src ] ); then \
      npm ci; \
      npm run build; \
      # Copy whatever ended up in dist/ into /out/public
      if [ -d dist ]; then cp -R dist/* /out/public/; fi; \
    else \
      echo "No frontend detected; skipping frontend build."; \
    fi


# ---------- 2) Backend build (Node/TS) ----------
FROM base AS build_back
WORKDIR /src
COPY . .

RUN set -eux; \
    \
    # --- Detect backend directory ---
    if [ -f backend/package.json ]; then \
      BACKEND_DIR="backend"; \
    elif [ -f package.json ]; then \
      BACKEND_DIR="."; \
    else \
      echo "ERROR: Could not find any package.json at ./package.json or ./backend/package.json"; \
      echo "Top-level files:"; ls -la; \
      echo "Recursive (depth 3):"; find . -maxdepth 3 -type f -name package.json -print; \
      exit 1; \
    fi; \
    \
    echo "Using BACKEND_DIR=$BACKEND_DIR"; \
    mkdir -p /work/backend; \
    cp -R "$BACKEND_DIR"/. /work/backend/; \
    cd /work/backend; \
    \
    # --- Install + build ---
    npm ci --include=dev; \
    npm run build; \
    \
    # --- Ensure runtime deps only ---
    npm prune --omit=dev; \
    \
    # --- Ensure dist/server.js exists (normalize entrypoint) ---
    if [ ! -f dist/server.js ]; then \
      FOUND="$(find dist -type f -name server.js | head -n 1 || true)"; \
      if [ -n "$FOUND" ]; then \
        echo "dist/server.js not found; using $FOUND as entrypoint"; \
        mkdir -p dist; \
        cp "$FOUND" dist/server.js; \
      else \
        echo "ERROR: Build succeeded but no server.js found under dist/"; \
        echo "dist contents:"; ls -la dist || true; \
        echo "dist tree:"; find dist -maxdepth 4 -type f -print || true; \
        exit 1; \
      fi; \
    fi; \
    \
    # --- Export runtime bundle ---
    mkdir -p /out/backend; \
    cp -R dist node_modules package*.json /out/backend/


# ---------- 3) Runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app/backend
ENV NODE_ENV=production

# (Optional but recommended) create data dir for sqlite if you mount a volume later
RUN mkdir -p /app/backend/data

# Copy backend runtime bundle
COPY --from=build_back /out/backend/ ./

# Copy frontend build output (if any) into dist/public for your express static setup
COPY --from=build_front /out/public ./dist/public

EXPOSE 8080
CMD ["node", "dist/server.js"]
