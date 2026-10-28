# Nest API (v2) — shares Postgres + Redis with the Express server (v1).
# Uses pnpm with the committed lockfile: npm's resolver crashes on this
# dependency graph ("Cannot read properties of null (reading 'matches')").
FROM node:20-slim

# openssl: Prisma's postinstall probes for it; node:*-slim does not ship it.
# wget: Coolify's Docker healthcheck uses wget (curl alone is not enough).
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates wget \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
# --prod=false is deliberate: Coolify injects NODE_ENV=production as a build
# arg, which makes pnpm skip devDependencies. The build needs the Prisma CLI
# and the Nest CLI, and both are devDependencies.
RUN pnpm install --frozen-lockfile --prod=false

COPY . .

# Prisma client + production build.
RUN pnpm exec prisma generate && pnpm run build

ENV NODE_ENV=production
EXPOSE 8001

CMD ["node", "dist/main"]
