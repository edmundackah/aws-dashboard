# syntax=docker/dockerfile:1

FROM node:22-alpine

WORKDIR /app

# Install required packages
RUN apk add --no-cache unzip libc6-compat ca-certificates

# Disable strict SSL if using internal registry/self-signed certs
RUN npm config set strict-ssl false

# Copy ZIP and extract it
COPY aws-dashboard.zip .

RUN unzip aws-dashboard.zip -d extracted && \
    mv extracted/*/* . && \
    rm -rf extracted aws-dashboard.zip

# Install production dependencies only
RUN npm ci --omit=dev --no-audit --no-fund

# Build the Next.js application
RUN npm run build

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8081
ENV HOSTNAME=0.0.0.0

# Expose the app port
EXPOSE 8081

# Start the app with Next.js
CMD ["npm", "start"]