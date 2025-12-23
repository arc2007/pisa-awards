# syntax=docker/dockerfile:1

########################
# Frontend build stage #
########################
FROM node:20-alpine AS build_front
WORKDIR /app

# Install frontend deps
COPY pisa-proyect/package*.json ./
RUN npm ci

# Copy frontend source and build
COPY pisa-proyect/ ./
RUN npm run build


#######################
# Backend build stage  #
#######################
FROM node:20-alpine AS build_back
WORKDIR /app/backend

# Build tooling for native deps (sqlite, etc.)
RUN apk add --no-cache python3 make g++ sqlite-libs

# Install backend deps first (cached layer)
COPY pisa-proyect/backend/package*.json ./
RUN npm ci --include=dev

# Copy backend source
COPY pisa-proyect/backend/ ./

# If host node_modules got copied in your build context, it can break executable perms.
# Reinstall cleanly inside the container, then build.
RUN rm -rf node_modules \
  && npm ci --include=dev \
  && chmod -R a+rx node_modules/.bin || true

# Build TypeScript -> dist/
RUN npm run build

# Trim dev deps for runtime
RUN npm prune --omit=dev


#################
# Runtime stage #
#################
FROM node:20-alpine AS runtime
WORKDIR /app

RUN apk add --no-cache sqlite-libs

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# --- Backend runtime files ---
WORKDIR /app/backend
COPY --from=build_back /app/backend/package*.json ./
COPY --from=build_back /app/backend/node_modules ./node_modules
COPY --from=build_back /app/backend/dist ./dist

# Copy your SQLite DB (your repo has premios.db)
COPY --from=build_back /app/backend/premios.db ./premios.db

# --- Frontend into backend/dist/public ---
# Your server.ts serves: path.join(__dirname, "public")
# In runtime, __dirname will be /app/backend/dist, so we must place Angular there:
# /app/backend/dist/public/{index.html,...}
COPY --from=build_front /app/dist/pisa-proyect/browser ./dist/public

# Start backend (your entrypoint is dist/server.js)
CMD ["node", "dist/server.js"]
