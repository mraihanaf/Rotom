# ---------- Builder ----------
FROM node:25-trixie-slim AS builder

WORKDIR /app

# Install pnpm explicitly
RUN npm install -g pnpm

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/

# Install deps (incl dev)
RUN pnpm install --frozen-lockfile

# Copy full monorepo
COPY . .

# Build backend only
RUN pnpm --filter backend build


# ---------- Production ----------
FROM node:25-trixie-slim

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/

# Prod deps only
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/apps/backend/dist ./dist

EXPOSE 3000
CMD ["node", "dist/src/main.js"]
