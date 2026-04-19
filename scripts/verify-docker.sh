#!/bin/bash
# ============================================================================
# Rotom Docker Production Verification Script
# Tests that backend and whatsapp-bot Docker images build and run correctly
# ============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[VERIFY]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

log "Starting Docker verification from: $PROJECT_ROOT"

# ============================================================================
# Step 1: Check prerequisites
# ============================================================================
log "Checking prerequisites..."

command -v docker >/dev/null 2>&1 || { error "Docker is required but not installed."; exit 1; }
command -v docker compose >/dev/null 2>&1 || { error "Docker Compose is required but not installed."; exit 1; }

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    warn ".env.production not found! Creating from template..."
    cp .env.production.example .env.production
    warn "Please edit .env.production with your production values before deploying!"
    warn "For testing, default values will be used."
fi

# ============================================================================
# Step 2: Build backend image
# ============================================================================
log "Building backend Docker image..."
docker build -t rotom-backend:test -f apps/backend/Dockerfile .

log "Backend image built successfully!"
docker images rotom-backend:test --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}"

# ============================================================================
# Step 3: Build whatsapp-bot image
# ============================================================================
log "Building whatsapp-bot Docker image..."
docker build -t rotom-whatsapp-bot:test -f apps/whatsapp-bot/Dockerfile .

log "WhatsApp bot image built successfully!"
docker images rotom-whatsapp-bot:test --format "table {{.Repository}}:{{.Tag}}\t{{.Size}}"

# ============================================================================
# Step 4: Test backend container starts
# ============================================================================
log "Testing backend container startup..."

# Create test network
docker network create rotom-test-net 2>/dev/null || true

# Start Redis for testing
log "Starting test Redis container..."
docker run -d --name rotom-test-redis --network rotom-test-net \
    -p 6379:6379 redis:7.2-alpine redis-server --bind 0.0.0.0 --port 6379 || true

# Give Redis a moment to start
sleep 2

# Test backend with minimal env
docker run -d --name rotom-test-backend --network rotom-test-net \
    -p 3000:3000 \
    -e NODE_ENV=production \
    -e PORT=3000 \
    -e REDIS_HOST=rotom-test-redis \
    -e REDIS_PORT=6379 \
    -e DATABASE_URL=file:./data/test.db \
    -e BETTER_AUTH_SECRET=test-secret-for-verification-only-do-not-use-in-production \
    -e BETTER_AUTH_URL=http://localhost:3000 \
    -e FRONTEND_URL=* \
    -e S3_ENDPOINT=http://localhost:9000 \
    -e S3_BUCKET=test \
    -e S3_ACCESS_KEY=test \
    -e S3_SECRET_KEY=test \
    rotom-backend:test

# Wait for backend to start
log "Waiting for backend to start (30s)..."
sleep 10

# Check health endpoint
for i in {1..10}; do
    if curl -sf http://localhost:3000/health 2>/dev/null; then
        log "Backend health check passed!"
        curl -s http://localhost:3000/health | jq . 2>/dev/null || curl -s http://localhost:3000/health
        break
    fi
    if [ $i -eq 10 ]; then
        error "Backend health check failed after 30s"
        docker logs rotom-test-backend
        exit 1
    fi
    sleep 2
done

# ============================================================================
# Step 5: Verify non-root user
# ============================================================================
log "Verifying security: checking non-root user..."
BACKEND_USER=$(docker exec rotom-test-backend id -u 2>/dev/null || echo "unknown")
if [ "$BACKEND_USER" != "0" ]; then
    log "✓ Backend runs as non-root user (UID: $BACKEND_USER)"
else
    warn "Backend is running as root - this is not recommended for production"
fi

# ============================================================================
# Step 6: Test whatsapp-bot container starts
# ============================================================================
log "Testing whatsapp-bot container startup..."

docker run -d --name rotom-test-whatsapp-bot --network rotom-test-net \
    -e NODE_ENV=production \
    -e REDIS_HOST=rotom-test-redis \
    -e REDIS_PORT=6379 \
    rotom-whatsapp-bot:test

# Wait for whatsapp-bot
log "Waiting for whatsapp-bot to start (10s)..."
sleep 5

# Check if still running (Baileys will wait for QR scan, but container should stay up)
if docker ps | grep -q rotom-test-whatsapp-bot; then
    log "WhatsApp bot container is running!"
else
    error "WhatsApp bot container stopped unexpectedly"
    docker logs rotom-test-whatsapp-bot
    exit 1
fi

WHATSAPP_USER=$(docker exec rotom-test-whatsapp-bot id -u 2>/dev/null || echo "unknown")
if [ "$WHATSAPP_USER" != "0" ]; then
    log "✓ WhatsApp bot runs as non-root user (UID: $WHATSAPP_USER)"
else
    warn "WhatsApp bot is running as root - this is not recommended for production"
fi

# ============================================================================
# Cleanup
# ============================================================================
log "Cleaning up test containers..."
docker stop rotom-test-backend rotom-test-whatsapp-bot rotom-test-redis 2>/dev/null || true
docker rm -f rotom-test-backend rotom-test-whatsapp-bot rotom-test-redis 2>/dev/null || true
docker network rm rotom-test-net 2>/dev/null || true

# ============================================================================
# Summary
# ============================================================================
log "=========================================================="
log "✓ Docker verification completed successfully!"
log "=========================================================="
log ""
log "Images created:"
docker images --filter=reference="rotom-*:test" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
log ""
log "To deploy to production:"
log "  1. Edit .env.production with your actual values"
log "  2. Run: docker compose -f docker-compose.prod.yaml up -d"
log ""
log "To scan for security issues:"
log "  docker scout cves rotom-backend:test"
log "  docker scout cves rotom-whatsapp-bot:test"
