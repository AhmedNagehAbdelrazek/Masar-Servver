# Nest API (v2) — shares Postgres + Redis with the Express server (v1).
FROM node:20-slim

WORKDIR /app

# Install (no lockfile in this folder — npm resolves from package.json).
COPY package.json ./
RUN npm install --no-audit --no-fund

COPY . .

# Prisma client + production build.
RUN npx prisma generate && npm run build

ENV NODE_ENV=production
EXPOSE 8001

CMD ["node", "dist/main"]
