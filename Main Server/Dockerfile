FROM node:20 AS builder

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build
# Keep only production deps for the final image (keeps native modules like bcrypt compiled)
RUN pnpm prune --prod

FROM node:20-slim

RUN corepack enable && corepack prepare pnpm@9 --activate

ENV NODE_ENV=production

WORKDIR /app

# Copy pruned production node_modules and built output from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist ./dist
# Migrations are needed at runtime (Sequelize)
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/.sequelizerc ./.sequelizerc

EXPOSE 8000

CMD ["node", "dist/server.js"]
