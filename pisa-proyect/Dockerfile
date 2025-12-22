# syntax=docker/dockerfile:1

FROM node:20-alpine AS build

# Needed for sqlite3 native module builds on Alpine
RUN apk add --no-cache python3 make g++ sqlite-libs

WORKDIR /src
COPY . .

# Build backend + (optional) Angular frontend from either:
# - ./pisa-proyect (monorepo subfolder)
# - ./ (repo root)
RUN set -eux; \
  if [ -f "pisa-proyect/package.json" ] || [ -d "pisa-proyect/backend" ]; then \
    APP_DIR="pisa-proyect"; \
  else \
    APP_DIR="."; \
  fi; \
  \
  if [ -f "$APP_DIR/backend/package.json" ]; then \
    BACKEND_DIR="$APP_DIR/backend"; \
  elif [ -f "$APP_DIR/package.json" ]; then \
    BACKEND_DIR="$APP_DIR"; \
  else \
    echo "ERROR: backend package.json not found in $APP_DIR (looked for $APP_DIR/backend/package.json and $APP_DIR/package.json)"; \
    ls -la; \
    ls -la "$APP_DIR" || true; \
    exit 1; \
  fi; \
  \
  mkdir -p /out/backend /out/public; \
  \
  echo "==> Building backend in: $BACKEND_DIR"; \
  cd "$BACKEND_DIR"; \
  npm ci --include=dev; \
  npm run build; \
  npm prune --omit=dev; \
  cp -R dist node_modules package*.json /out/backend/; \
  \
  echo "==> Checking frontend in: $APP_DIR"; \
  cd "/src/$APP_DIR"; \
  if [ -f package.json ] && ( [ -f angular.json ] || [ -d src ] ); then \
    npm ci; \
    npm run build; \
    if [ -d dist ]; then cp -R dist/* /out/public/; fi; \
  else \
    echo "No frontend detected; skipping."; \
  fi


FROM node:20-alpine AS runtime
WORKDIR /app/backend
ENV NODE_ENV=production

# sqlite runtime libs (safe even if already present)
RUN apk add --no-cache sqlite-libs

# Backend runtime bundle (includes dist + prod node_modules)
COPY --from=build /out/backend/ ./

# Frontend into dist/public for your server.ts:
# const publicDir = path.join(__dirname, "public");
COPY --from=build /out/public/ ./dist/public

EXPOSE 8080
CMD ["node", "dist/server.js"]
