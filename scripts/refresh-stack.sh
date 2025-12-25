#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-${PROJECT_ROOT}/docker-compose.yml}"
DOCKER_CMD="${DOCKER_CMD:-docker}"

log() {
  printf '[%s] %s\n' "$(date +'%%Y-%%m-%%d %%H:%%M:%%S')" "$1"
}

usage() {
  cat <<'EOF'
Usage: refresh-stack.sh [options]

Rebuilds and restarts the Docker Compose stack so that containers always run with the latest code.

Options:
  --restart-only      Restart containers without rebuilding images
  --no-pull           Skip pulling the latest base images during rebuild
  --no-cache          Disable the build cache for a completely fresh image build
  --fresh             Stop the stack, remove orphan containers, and prune volumes before rebuild
  --logs              Follow combined service logs after the stack starts
  -h, --help          Show this message
EOF
}

trap 'log "Script failed"; exit 1' ERR

if ! command -v "${DOCKER_CMD}" >/dev/null 2>&1; then
  printf 'Error: "%s" is not available in PATH.\n' "${DOCKER_CMD}" >&2
  exit 1
fi

if ! "${DOCKER_CMD}" compose version >/dev/null 2>&1; then
  printf 'Error: docker compose plugin is required.\n' >&2
  exit 1
fi

PULL_BASE=1
USE_CACHE=1
FRESH=0
RESTART_ONLY=0
FOLLOW_LOGS=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --restart-only)
      RESTART_ONLY=1
      ;;
    --no-pull)
      PULL_BASE=0
      ;;
    --no-cache)
      USE_CACHE=0
      ;;
    --fresh)
      FRESH=1
      ;;
    --logs)
      FOLLOW_LOGS=1
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      printf 'Unknown option: %s\n' "$1" >&2
      usage
      exit 1
      ;;
  esac
  shift
done

compose() {
  "${DOCKER_CMD}" compose -f "${COMPOSE_FILE}" "$@"
}

if [[ ${FRESH} -eq 1 ]]; then
  log "Stopping stack and removing previous containers"
  compose down --remove-orphans --volumes
fi

if [[ ${RESTART_ONLY} -eq 1 ]]; then
  log "Restarting containers without rebuild"
  compose restart
else
  log "Building images with latest changes"
  build_args=(build)
  [[ ${PULL_BASE} -eq 1 ]] && build_args+=(--pull)
  [[ ${USE_CACHE} -eq 0 ]] && build_args+=(--no-cache)
  compose "${build_args[@]}"

  log "Recreating containers"
  compose up -d --force-recreate --remove-orphans
fi

log "Current stack status"
compose ps

if [[ ${FOLLOW_LOGS} -eq 1 ]]; then
  log "Following logs (press Ctrl+C to stop)"
  compose logs -f
fi

log "Done"
