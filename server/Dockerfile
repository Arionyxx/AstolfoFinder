# syntax=docker/dockerfile:1

FROM node:18-alpine AS base
WORKDIR /app

RUN apk add --no-cache python3 make g++ libc6-compat openssl

# Copy dependency manifests and shared configuration
COPY tsconfig.base.json ./tsconfig.base.json
COPY server/package.json ./package.json
COPY server/tsconfig.json ./tsconfig.json
COPY server/prisma ./prisma

# Install dependencies (including development tooling for builds)
RUN npm install

# Copy source for compilation
COPY server/src ./src

# Build the TypeScript project
FROM base AS build
RUN npm run build

# Prepare production dependencies only
FROM base AS production-deps
RUN npm prune --production

# Production runtime image
FROM node:18-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

RUN apk add --no-cache libc6-compat openssl

COPY --from=production-deps /app/node_modules ./node_modules
COPY --from=production-deps /app/prisma ./prisma
COPY --from=build /app/dist ./dist
COPY server/package.json ./package.json

EXPOSE 3001
CMD ["node", "dist/index.js"]

# Development image with hot reload tooling
FROM base AS development
ENV NODE_ENV=development
ENV PORT=3001

EXPOSE 3001
CMD ["npm", "run", "dev"]
