# ─────── Stage 1: Build ───────
FROM node:22-slim AS builder

ENV NODE_ENV=production

# Install system dependencies
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install && npm rebuild lightningcss

COPY . .
RUN npm run build

# ─────── Stage 2: Runtime ───────
FROM node:20-slim AS runner

ENV NODE_ENV=production

RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs -m nextjs

WORKDIR /app

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json

EXPOSE 3000
USER nextjs

CMD ["npx", "next", "start"]