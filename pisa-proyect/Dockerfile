# ---- 1) Build frontend (Angular) ----
FROM node:20-alpine AS build_front
WORKDIR /app

COPY package*.json ./
# Angular necesita dev deps para compilar
ENV NODE_ENV=development
ENV NPM_CONFIG_PRODUCTION=false
RUN npm ci --include=dev

COPY . .
RUN npm run build


# ---- 2) Build backend (Node/TS) ----
FROM node:20-alpine AS build_back
WORKDIR /app/backend

COPY backend/package*.json ./
# IMPORTANTE: asegurar que NO se omiten devDependencies
ENV NODE_ENV=development
ENV NPM_CONFIG_PRODUCTION=false
RUN npm ci --include=dev

COPY backend ./
RUN npm run build


# ---- 3) Runtime ----
FROM node:20-alpine AS runtime
WORKDIR /app/backend

ENV NODE_ENV=production

# Instalar SOLO prod deps en runtime
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Backend compilado
COPY --from=build_back /app/backend/dist ./dist

# Frontend compilado dentro de dist/public
COPY --from=build_front /app/dist ./dist/public

EXPOSE 8080
CMD ["node", "dist/server.js"]
