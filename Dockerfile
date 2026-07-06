FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:22-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=backend-build /app/backend/package*.json ./
RUN npm ci --omit=dev
COPY --from=backend-build /app/backend/dist/ ./
COPY --from=frontend-build /app/frontend/dist/ ./public/
EXPOSE 3000
CMD ["node", "server.js"]
