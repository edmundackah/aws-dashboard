FROM node:22-alpine

WORKDIR /app

# Install required tools
RUN apk add --no-cache unzip libc6-compat ca-certificates

# Disable strict SSL if needed (e.g., for internal registries)
RUN npm config set strict-ssl false

# Copy and extract app
COPY aws-dashboard.zip .

RUN unzip aws-dashboard.zip -d extracted && \
    mv extracted/*/* . && \
    rm -rf extracted aws-dashboard.zip

# Install production dependencies
RUN npm ci --no-audit --no-fund

# Copy static and public assets into standalone folder & and build the app
RUN npm run build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/

RUN find .next/standalone -type f | sort

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8081
ENV HOSTNAME=0.0.0.0

EXPOSE 8081
CMD ["node", ".next/standalone/server.js"]