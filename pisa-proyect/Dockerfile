# syntax=docker/dockerfile:1

############################
# 1) Frontend build (optional Angular)
############################
FROM node:20-alpine AS build_front
WORKDIR /src

# Copy entire build context (works if the context is repo root or a subfolder)
COPY . .

# Always create output dir so COPY --from never fails
RUN set -eux; \
  mkdir -p /out/public; \
  if [ -f package.json ] && ( [ -f angular.json ] || [ -d src ] ); then \
    npm ci; \
    npm run build; \
    # Angular commonly outputs dist/<project>/...
    if [ -d dist ]; then cp -R dist/* /out/public/; fi; \
  else \
    echo "No frontend detected in this build context; skipping frontend build."; \
  fi


############################
# 2) Backend build (Node/TS)
############################
FROM node:20-alpine AS build_back
WORKDIR /src

COPY . .

RUN set -eux; \
  # Detect where the backend lives
  if [ -f backend/package.json ]; then \
    BACKEND_DIR="backend"; \
  elif [ -f package.json ]; then \
    BACKEND_DIR="."; \
  else \
    echo "ERROR: No package.json found in the Docker build context."; \
    echo "Fix: In Fly UI / flyctl, make sure the build context points to the folder that contains your backend package.json"; \
    echo "      (repo root or ./backend), and that .dockerignore isn't excluding package.json files."; \
    echo "Context listing:"; \
    ls -la; \
    exit 1; \
  fi; \
  echo "Using backend dir: $BACKEND_DIR"; \
  \
  # Install + build in a clean work dir
  mkdir -p /work/backend; \
  cp -R "$BACKEND_DIR"/. /work/backend/; \
  cd /work/backend; \
  npm ci --include=dev; \
  npm run build; \
  npm prune --omit=dev; \
  \
  # Copy runtime artifacts out
  mkdir -p /out/backend; \
  cp -R package*.json node_modules /out/backend/; \
  if [ -d dist ]; then cp -R dist /out/backend/; fi; \
  # common optional runtime assets (safe if missing)
  if [ -d prisma ]; then cp -R prisma /out/backend/; fi; \
  if [ -d public ]; then cp -R public /out/backend/; fi


############################
# 3) Runtime
############################
FROM node:20-alpine AS runtime
WORKDIR /app/backend
ENV NODE_ENV=production

# Backend runtime bundle
COPY --from=build_back /out/backend/ ./

# Frontend output into backend public dir (if your server serves it from dist/public)
COPY --from=build_front /out/public ./dist/public

EXPOSE 8080

# Don't hardcode dist/server.js — use your package.json "start" script
CMD ["npm", "start"]
