FROM node:20-slim AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm ci
RUN npm run build

FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist/
COPY migrations/ ./migrations/

EXPOSE 4000

CMD ["node", "dist/server.js"]
