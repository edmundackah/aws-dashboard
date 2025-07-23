FROM node:22-alpine AS base
WORKDIR /app

# --- Source stage: Clone the repo and checkout a specific branch
FROM base AS source
RUN apk add --no-cache git

RUN git clone --branch "main" --depth 1 "https://github.com/edmundackah/aws-dashboard.git" /app

# --- Dependency install stage ---
FROM base AS deps
COPY --from=source /app/package.json /app/package-lock.json ./
RUN npm ci

# --- Build stage ---
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=source /app ./
RUN npm run build

# --- Production runner stage ---
FROM node:22-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

ENV NODE_ENV=production

ENV PORT=8080
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 8080

CMD ["node", "server.js"]