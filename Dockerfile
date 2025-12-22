# syntax=docker/dockerfile:1

############################
# 1) Build frontend (Angular) - optional
############################
FROM node:20-alpine AS build_front
WORKDIR /src
COPY . .

# Always create output so runtime COPY never fails
RUN set -eux; \
    mkdir -p /out/public; \
    FRONTEND_DIR=""; \
    if [ -f angular.json ]; then \
      FRONTEND_DIR="."; \
    else \
      # Find an angular.json (common in monorepos) up to 6 levels deep
      FRONTEND_DIR="$(find . -maxdepth 6 -type f -name angular.json -not -path '*/node_modules/*' -print | head -n1 | xargs -r dirname || true)"; \
    fi; \
    if [ -n "${FRONTEND_DIR}" ] && [ -f "${FRONTEND_DIR}/package.json" ]; then \
      echo "Frontend detected at: ${FRONTEND_DIR}"; \
      cd "${FRONTEND_DIR}"; \
      npm ci; \
      npm run build; \
      # Copy whatever is in dist/ to /out/public (Angular typically writes dist/<app>/...)
      if [ -d dist ]; then cp -R dist/* /out/public/; fi; \
    else \
      echo "No Angular frontend detected; skipping frontend build."; \
    fi


############################
# 2) Build backend (Node/TS)
############################
FROM node:20-alpine AS build_back
WORKDIR /src
COPY . .

# Produces:
#   /out/backend/dist
#   /out/backend/node_modules  (prod-only)
#   /out/backend/package*.json
RUN set -eux; \
    BACKEND_DIR=""; \
    # Prefer the conventional ./backend folder if present
    if [ -f backend/package.json ]; then \
      BACKEND_DIR="backend"; \
    elif [ -f package.json ] && [ -f tsconfig.json ]; then \
      # Backend at repo root
      BACKEND_DIR="."; \
    else \
      # Heuristic: find a tsconfig.json and use its directory as backend root
      BACKEND_DIR="$(find . -maxdepth 6 -type f -name tsconfig.json -not -path '*/node_modules/*' -print | head -n1 | xargs -r dirname || true)"; \
    fi; \
    BACKEND_DIR="${BACKEND_DIR#./}"; \
    if [ -z "${BACKEND_DIR}" ] || [ ! -f "${BACKEND_DIR}/package.json" ]; then \
      echo "ERROR: Could not find backend package.json."; \
      echo "Root contents:"; ls -la; \
      echo "package.json files found:"; find . -maxdepth 6 -type f -name package.json -not -path '*/node_modules/*' -print || true; \
      echo "tsconfig.json files found:"; find . -maxdepth 6 -type f -name tsconfig.json -not -path '*/node_modules/*' -print || true; \
      exit 1; \
    fi; \
    echo "Backend detected at: ${BACKEND_DIR}"; \
    mkdir -p /work/backend; \
    cp -R "${BACKEND_DIR}/." /work/backend/; \
    cd /work/backend; \
    npm ci --include=dev; \
    npm run build; \
    npm prune --omit=dev; \
    mkdir -p /out/backend; \
    cp -R dist node_modules package*.json /out/backend/


############################
# 3) Runtime
############################
FROM node:20-alpine AS runtime
WORKDIR /app/backend
ENV NODE_ENV=production

# Backend runtime bundle
COPY --from=build_back /out/backend/ ./

# Frontend build output (if any) into backend public dir
# (Your server serves ./dist/public per your original Dockerfile)
COPY --from=build_front /out/public ./dist/public

EXPOSE 8080
CMD ["node", "dist/server.js"]
