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

# Install production dependencies and build the app
RUN npm ci --no-audit --no-fund && npm run build

# Manually copy public and static assets into standalone folder
# Copy static and public assets into standalone folder
RUN cp -r public .next/standalone/ && \
    cp -r .next/static .next/standalone/.next/ && \
    echo "Copied public and static files to .next/standalone" && \
    echo ".next/standalone contents:" && \
    find .next/standalone -type f | sort

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

WORKDIR /app/.next/standalone

EXPOSE 8080
CMD ["node", "server.js"]