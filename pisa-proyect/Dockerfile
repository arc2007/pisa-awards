# syntax=docker/dockerfile:1

########################
# Frontend build stage #
########################
FROM node:20-alpine AS build_front
WORKDIR /app

# Install frontend dependencies
COPY pisa-proyect/package*.json ./
RUN npm ci

# Copy frontend source
COPY pisa-proyect/ ./

# Build Angular app
RUN npm run build


#######################
# Backend build stage #
#######################
FROM node:20-alpine AS build_back
WORKDIR /app/backend

# Native deps for sqlite / node-gyp
RUN apk add --no-cache python3 make g++ sqlite-libs

# Install backend deps (with dev deps for TypeScript)
COPY pisa-proyect/backend/package*.json ./
RUN npm ci --include=dev

# Copy backend source
COPY pisa-proyect/backend/ ./

# 🔧 Fix executable permissions for tsc
RUN chmod -R a+rx node_modules/.bin \
  && chmod a+rx node_modules/typescript/bin/tsc \
  && npm run build

# Remove dev deps for runtime
RUN npm prune --omit=dev


#################
# Runtime stage #
#################
FROM node:20-alpine AS runtime
WORKDIR /app

RUN apk add --no-cache sqlite-libs

ENV NODE_ENV=production
ENV PORT=8080

################
# Backend app #
################
WORKDIR /app/backend
COPY --from=build_back /app/backend/package*.json ./
COPY --from=build_back /app/backend/node_modules ./node_modules
COPY --from=build_back /app/backend/dist ./dist
COPY --from=build_back /app/backend/prizes.db ./prizes.db || true

##################
# Frontend app  #
##################
# Angular output path: dist/pisa-proyect/browser
WORKDIR /app/frontend
COPY --from=build_front /app/dist/pisa-proyect/browser ./public

EXPOSE 8080

# Start backend server
WORKDIR /app/backend
CMD ["node", "dist/server.js"]
