FROM node:22-alpine AS base
WORKDIR /app

# --- Unzip & Install Dependencies ---
FROM base AS deps

# Add required tools
RUN apk add --no-cache unzip libc6-compat

# Copy ZIP archive into image
COPY aws-dashboard.zip .

# Unzip contents (including flattening top-level folder)
RUN unzip aws-dashboard.zip -d extracted && \
    mv extracted/*/* . && \
    rm -rf extracted aws-dashboard.zip

# Clean leftover files from zip
RUN rm -rf node_modules .npmrc

# Install production dependencies + print logs on failure
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

# Add non-root user
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

# Copy only what's needed to run
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 8080
CMD ["node", "server.js"]