# ============================================================================
# Rotom WhatsApp Bot - Production Dockerfile
# Multi-stage build for BullMQ worker consuming jobs via Baileys
# ============================================================================

# ---------- Dependencies stage ----------
FROM node:22-slim AS deps

WORKDIR /app

# Install build dependencies for native modules (Baileys crypto libs), git, and SSL certs
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
COPY apps/whatsapp-bot/package.json apps/whatsapp-bot/

# Install dependencies (frozen lockfile for reproducibility)
RUN yarn install --immutable

# ---------- Builder stage ----------
FROM node:22-slim AS builder

WORKDIR /app

# Enable Corepack
RUN corepack enable && corepack prepare yarn@4.12.0 --activate

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/.yarn ./.yarn

# Copy full source
COPY package.json yarn.lock .yarnrc.yml nx.json ./
COPY packages ./packages
COPY apps/whatsapp-bot ./apps/whatsapp-bot

# Build application
WORKDIR /app/apps/whatsapp-bot
RUN yarn build

# ---------- Production stage ----------
FROM node:22-slim AS production

WORKDIR /app

# Install runtime dependencies and dumb-init for signal handling
RUN apt-get update && apt-get install -y --no-install-recommends \
    dumb-init \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd -r rotom && useradd -r -g rotom rotom

# Copy built application and production node_modules
COPY --from=builder /app/apps/whatsapp-bot/dist apps/whatsapp-bot/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Create auth state directory and set permissions
RUN mkdir -p /app/apps/whatsapp-bot/baileys_auth_info && \
    chown -R rotom:rotom /app

# Switch to non-root user
USER rotom

# Set working directory for the application
WORKDIR /app/apps/whatsapp-bot

# Volume for Baileys auth state persistence
VOLUME ["/app/apps/whatsapp-bot/baileys_auth_info"]

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
