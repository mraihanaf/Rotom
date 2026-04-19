# ============================================================================
# Rotom Backend - Production Dockerfile
# Multi-stage build with Yarn 4, native module compilation, and security hardening
# ============================================================================

# ---------- Dependencies stage ----------
FROM node:22-slim AS deps

WORKDIR /app

# Install build dependencies for native modules (better-sqlite3), git, and SSL certs
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Enable Corepack for Yarn 4
RUN corepack enable && corepack prepare yarn@4.12.0 --activate

# Copy workspace configuration
COPY package.json yarn.lock .yarnrc.yml nx.json ./
COPY .yarn ./.yarn

# Copy package manifests
COPY packages/typescript-config/package.json packages/typescript-config/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY apps/backend/package.json apps/backend/

# Install dependencies (frozen lockfile for reproducibility)
RUN yarn install --immutable

# ---------- Builder stage ----------
FROM node:22-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Enable Corepack
RUN corepack enable && corepack prepare yarn@4.12.0 --activate

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/.yarn ./.yarn

# Copy full source
COPY package.json yarn.lock .yarnrc.yml nx.json ./
COPY packages ./packages
COPY apps/backend ./apps/backend

# Generate Prisma client and build
WORKDIR /app/apps/backend
RUN npx prisma generate --generator client && \
    yarn build

# ---------- Production stage ----------
FROM node:22-slim AS production

WORKDIR /app

# Install runtime dependencies for SQLite and health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    dumb-init \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd -r rotom && useradd -r -g rotom rotom

# Enable Corepack for production
RUN corepack enable && corepack prepare yarn@4.12.0 --activate

# Copy built application and production node_modules
COPY --from=builder /app/apps/backend/dist apps/backend/dist
COPY --from=builder /app/apps/backend/prisma apps/backend/prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Set working directory
WORKDIR /app/apps/backend

# Create data directory and set permissions (only chown the data dir, not node_modules)
RUN mkdir -p /app/data && chown -R rotom:rotom /app/data

# Copy and setup entrypoint script
COPY apps/backend/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Switch to non-root user
USER rotom

# Expose application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Use dumb-init for proper signal handling, entrypoint for migrations
ENTRYPOINT ["dumb-init", "--", "docker-entrypoint.sh"]
CMD ["node", "dist/src/main.js"]
