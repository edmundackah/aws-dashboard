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

# Move static and public assets into standalone folder
RUN mv .next/static .next/standalone/.next
RUN mv public .next/standalone/

RUN find .next/standalone -type f | sort

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

EXPOSE 8080
CMD ["node", ".next/standalone/server.js"]