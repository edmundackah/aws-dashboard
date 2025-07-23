# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app

# --- Unzip and install deps ---
FROM base AS deps
RUN apk add --no-cache unzip

# Copy ZIP archive into container
COPY aws-dashboard.zip .

# Unzip and move contents if they're inside a top-level folder
RUN unzip aws-dashboard.zip -d extracted && \
    mv extracted/*/* . && \
    rm -rf extracted aws-dashboard.zip

# Install only production dependencies
RUN npm ci

# --- Build stage ---
FROM base AS builder
COPY --from=deps /app ./
RUN npm run build

# --- Runtime stage ---
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