# syntax=docker/dockerfile:1

ARG VITE_API_URL=http://backend:3001

FROM node:18-alpine AS deps
WORKDIR /app

# Ensure the shared TypeScript config is available for the workspace
COPY tsconfig.base.json ./tsconfig.base.json
COPY client/package.json ./client/package.json

WORKDIR /app/client
RUN npm install

# Build the production assets with Vite
FROM deps AS build
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
COPY client/ ./
RUN npm run build

# Development image for hot reload
FROM deps AS development
ARG VITE_API_URL
ENV NODE_ENV=development
ENV PORT=3000
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_DEV_PROXY_TARGET=${VITE_API_URL}
COPY client/ ./
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]

# Production image served by nginx
FROM nginx:1.27-alpine AS production
ENV NODE_ENV=production
COPY client/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/client/dist /usr/share/nginx/html
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
