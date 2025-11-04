#!/bin/bash
echo "=============================================="
echo "🚀 R-OS Deployment Script"
echo "=============================================="

# Detect script directory (cross-platform)
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "📂 Project Directory: $PROJECT_DIR"

DOCKER_COMPOSE_FILE="$PROJECT_DIR/docker-compose.yml"

SERVICE=$1
VALID_SERVICES=("user-service")

if [[ -z "$SERVICE" ]]; then
  echo "❌ No service specified!"
  echo "👉 Usage: ./deploy.sh {service-name | all}"
  exit 1
fi

if [[ ! " ${VALID_SERVICES[@]} " =~ " ${SERVICE} " ]]; then
  echo "❌ Invalid service: $SERVICE"
  echo "✅ Available: ${VALID_SERVICES[*]}"
  exit 1
fi

echo "📌 Pulling latest code..."
git pull origin main || echo "⚠️ Git pull failed, continuing with existing code..."

migrate_service() {
  local svc=$1
  echo "📂 Running migrations for $svc..."
  docker compose -f "$DOCKER_COMPOSE_FILE" run --rm "$svc" npx migrate-mongo up || \
    echo "⚠️ Migration skipped or failed for $svc"
}

if [[ "$SERVICE" == "all" ]]; then
  echo "🛑 Stopping all services..."
  docker compose -f "$DOCKER_COMPOSE_FILE" down

  echo "🛠️ Building all Docker images..."
  docker compose -f "$DOCKER_COMPOSE_FILE" build --parallel

  for svc in "${VALID_SERVICES[@]}"; do
    if [[ "$svc" != "all" ]]; then migrate_service "$svc"; fi
  done

  echo "🚀 Starting all services..."
  docker compose -f "$DOCKER_COMPOSE_FILE" up -d
else
  echo "🛑 Stopping $SERVICE..."
  docker compose -f "$DOCKER_COMPOSE_FILE" stop "$SERVICE" 2>/dev/null

  echo "🛠️ Building $SERVICE..."
  docker compose -f "$DOCKER_COMPOSE_FILE" build "$SERVICE"

  migrate_service "$SERVICE"

  echo "🚀 Starting $SERVICE..."
  docker compose -f "$DOCKER_COMPOSE_FILE" up -d "$SERVICE"
fi

echo "🧹 Cleaning old images..."
docker image prune -f

echo "✅ Deployment complete for: $SERVICE"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
