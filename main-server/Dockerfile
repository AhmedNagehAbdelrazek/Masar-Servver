FROM node:20

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts || pnpm install --ignore-scripts

COPY . .

EXPOSE 8000

CMD ["npx", "tsx", "server.ts"]
