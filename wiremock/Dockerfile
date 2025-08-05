FROM node:22-alpine AS builder

WORKDIR /app

# Install tools needed for build only
RUN apk add --no-cache unzip libc6-compat ca-certificates

RUN npm config set strict-ssl false

# Copy zipped source
COPY aws-dashboard.zip .

# Unzip and flatten if extracted into a subfolder
RUN unzip aws-dashboard.zip -d extracted && \
    mv extracted/*/* . && \
    rm -rf extracted aws-dashboard.zip

# Install dependencies & build
RUN npm ci --no-audit --no-fund && npm run build

# Copy static/public into standalone output (needed to serve CSS/JS/images)
RUN cp -r public .next/standalone/ && \
    cp -r .next/static .next/standalone/.next/

# RUNTIME IMAGE
FROM node:22-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

# Copy only the necessary runtime files from the builder stage
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/standalone/.next/static ./.next/static
COPY --from=builder /app/.next/standalone/public ./public

# (Optional) Add custom CA PEM if needed
# COPY my-ca.pem /etc/ssl/certs/my-ca.pem
# RUN cat /etc/ssl/certs/my-ca.pem >> /etc/ssl/certs/ca-certificates.crt
# ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/my-ca.pem

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

USER nextjs
EXPOSE 8080

RUN node server.js

# Start the minimal standalone server
CMD ["node", "server.js"]