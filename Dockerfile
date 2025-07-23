# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app

# --- Dependencies + unzip + PEM ---
FROM base AS deps

# Install unzip and certificate tools
RUN apk add --no-cache unzip libc6-compat ca-certificates

# 👇 Add the PEM file to the system trusted certs
COPY artifactory.pem /usr/local/share/ca-certificates/artifactory.crt
RUN cp /usr/local/share/ca-certificates/artifactory.crt /usr/share/ca-certificates/artifactory.crt && \
    update-ca-certificates

# Copy ZIP archive into image
COPY aws-dashboard.zip .

# Unzip and flatten directory
RUN unzip aws-dashboard.zip -d extracted && \
    mv extracted/*/* . && \
    rm -rf extracted aws-dashboard.zip

# Clean up leftovers from zip
RUN rm -rf node_modules .npmrc

# Install deps and print logs on failure
RUN npm ci --no-audit --no-fund || \
  (echo "===== NPM LOG =====" && \
   cat /root/.npm/_logs/*-debug-0.log || true && \
   echo "===== END LOG =====" && \
   exit 1)

# --- Build Stage ---
FROM base AS builder
COPY --from=deps /app ./
RUN npm run build

# --- Runtime Image ---
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