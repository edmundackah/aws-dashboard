# syntax=docker/dockerfile:1

# Base image: Node 22 on Debian slim (not Alpine)
FROM node:22-slim AS base
WORKDIR /app

# --- Unzip and install dependencies ---
FROM base AS deps

# Install unzip
RUN apt-get update && apt-get install -y unzip && rm -rf /var/lib/apt/lists/*

# Copy your zip file
COPY aws-dashboard.zip .

# Unzip and flatten top-level directory (if present)
RUN unzip aws-dashboard.zip -d extracted && \
    mv extracted/*/* . && \
    rm -rf extracted aws-dashboard.zip

# Remove leftover modules or npmrc if zip included them
RUN rm -rf node_modules .npmrc

# Run npm ci, and log any errors to stdout
RUN npm ci --no-audit --no-fund || \
  (echo "===== NPM LOG =====" && \
   cat /root/.npm/_logs/*-debug-0.log || true && \
   echo "===== END LOG =====" && \
   exit 1)

# --- Build Stage ---
FROM base AS builder
COPY --from=deps /app ./
RUN npm run build

# --- Production Stage ---
FROM node:22-slim AS runner
WORKDIR /app

# Add non-root user for security
RUN groupadd -r nodejs && useradd -r -g nodejs --uid 1001 nextjs

ENV NODE_ENV=production
ENV PORT=8088
ENV HOSTNAME=0.0.0.0

# Copy only what's needed for runtime
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 8088
CMD ["node", "server.js"]