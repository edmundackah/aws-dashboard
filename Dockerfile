# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app

# --- Dependency & Cert Setup ---
FROM base AS deps

# Install unzip and certificate tooling
RUN apk add --no-cache unzip libc6-compat ca-certificates

# Copy all certs (we'll filter only .crt later)
COPY certs/ /tmp/certs/

# Copy only `.crt` files to the system cert store and update
RUN find /tmp/certs -type f -name '*.crt' -exec cp {} /usr/share/ca-certificates/ \; && \
    update-ca-certificates && \
    rm -rf /tmp/certs

# Copy app ZIP
COPY aws-dashboard.zip .

# Unzip and flatten directory
RUN unzip aws-dashboard.zip -d extracted && \
    mv extracted/*/* . && \
    rm -rf extracted aws-dashboard.zip

# Clean possible leftover artifacts
RUN rm -rf node_modules .npmrc

# Install dependencies and surface logs on error
RUN npm ci --no-audit --no-fund || \
  (echo "===== NPM LOG =====" && \
   cat /root/.npm/_logs/*-debug-0.log || true && \
   echo "===== END LOG =====" && \
   exit 1)

# --- Build Stage ---
FROM base AS builder
COPY --from=deps /app ./
RUN npm run build

# --- Runtime Stage ---
FROM node:22-alpine AS runner
WORKDIR /app

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 8080
CMD ["node", "server.js"]