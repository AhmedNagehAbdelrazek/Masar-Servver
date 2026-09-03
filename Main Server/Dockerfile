FROM node:20

RUN corepack enable && corepack prepare pnpm@9 --activate

ENV CI=true

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

COPY . .

EXPOSE 8000

CMD ["node", "server.ts"]
