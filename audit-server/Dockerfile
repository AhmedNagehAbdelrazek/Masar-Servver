FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
RUN npm run build

COPY dist/ ./dist/
COPY migrations/ ./migrations/

EXPOSE 4000

CMD ["node", "dist/server.js"]
