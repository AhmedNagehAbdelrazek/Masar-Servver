# Nest API (v2) — shares Postgres + Redis with the Express server (v1).
# Uses pnpm with the committed lockfile: npm's resolver crashes on this
# dependency graph ("Cannot read properties of null (reading 'matches')").
FROM node:20-slim

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --no-fund

COPY . .

# Prisma client + production build.
RUN pnpm exec prisma generate && pnpm run build

ENV NODE_ENV=production
EXPOSE 8001

CMD ["node", "dist/main"]
