# Load Tests

This folder contains k6-based load tests.

## Scenarios

- `health-smoke.js`: basic health smoke test.
- `sequential-business-flow.js`: sequential chain of business requests through Gateway.
- `concurrent-business-operations.js`: parallel business operations (multiple concurrent scenarios).
- `sequential-service-phases.js`: phased per-service load (services are stressed one by one).

## Sequential per-service phased load

Purpose:
- apply load to microservices in sequence (phase by phase), so the graph clearly shows which service is under load at each time window.

Default phase order:
- `auth-service` -> `user-service` -> `task-service` -> `shop-service` -> `notification-service` -> `ai-service`

Run (with Grafana-visible metrics):
- `docker compose run --rm --no-deps -e PHASE_DURATION_SECONDS=30 -e PHASE_VUS=8 -e K6_PROMETHEUS_RW_SERVER_URL=http://prometheus:9090/api/v1/write k6 run -o experimental-prometheus-rw /scripts/sequential-service-phases.js`

Key env vars:
- `PHASE_DURATION_SECONDS` (default `30`)
- `PHASE_VUS` (default `8`)
- `REQUEST_PAUSE_SECONDS` (default `0.05`; set `0` for max throughput)
- `STRICT_THRESHOLDS=true` to enable hard-fail thresholds

High-throughput example (for higher RPS on chart):
- `docker compose run --rm --no-deps -e PHASE_DURATION_SECONDS=45 -e PHASE_VUS=20 -e REQUEST_PAUSE_SECONDS=0 -e K6_PROMETHEUS_RW_SERVER_URL=http://prometheus:9090/api/v1/write k6 run -o experimental-prometheus-rw /scripts/sequential-service-phases.js`

Grafana note:
- use dashboard query grouped by `service` label to see phase transitions, e.g. `sum by (service) (rate(k6_http_reqs_total{test_type="sequential_service_phases"}[$__rate_interval]))`.

## Local run

1. Start one API service, for example NotificationService:
   dotnet run --project NotificationService/NotificationService.Api/NotificationService.Api.csproj --urls http://localhost:8085
2. Run k6 test:
   k6 run load-tests/health-smoke.js

Optional environment variable:
- BASE_URL: target API base URL, default is http://localhost:8085
- HEALTH_PATH: health endpoint path, default is /notification-service/health

## Sequential business flow load test

Purpose:
- sequentially sends requests representing one business flow in a fixed order.

Run:
- `k6 run load-tests/sequential-business-flow.js`

Recommended env vars:
- `BASE_URL` (default `http://localhost:8081`)
- `VUS` (default `8`)
- `DURATION` (default `2m`)
- `LOGIN_EMAIL` and `LOGIN_PASSWORD` for authenticated operations
- `STRICT_THRESHOLDS=true` to enable hard-fail threshold checks (disabled by default)

Example:
- `BASE_URL=http://localhost:8081 LOGIN_EMAIL=parent@example.com LOGIN_PASSWORD=Pass123! k6 run load-tests/sequential-business-flow.js`

## Concurrent business operations load test

Purpose:
- simulates simultaneous business operations across multiple microservices.
- scenarios run in parallel for: `user-service`, `auth-service`, `task-service`, `shop-service`, `notification-service`, `ai-service`.

Run:
- `k6 run load-tests/concurrent-business-operations.js`

Run (with Grafana-visible metrics):
- `docker compose run --rm --no-deps -e DURATION=2m -e BROWSE_VUS=10 -e AUTH_VUS=12 -e TASK_VUS=12 -e SHOP_VUS=10 -e NOTIFICATION_VUS=8 -e AI_VUS=6 -e REQUEST_PAUSE_SECONDS=0.05 -e K6_PROMETHEUS_RW_SERVER_URL=http://prometheus:9090/api/v1/write k6 run -o experimental-prometheus-rw /scripts/concurrent-business-operations.js`

Recommended env vars:
- `GATEWAY_BASE_URL` (default `http://gateway-service:8081`)
- `AI_BASE_URL` (default `http://ai-service:8080`)
- `DURATION` (default `2m`)
- `BROWSE_VUS` (default `6`)
- `AUTH_VUS` (default `8`)
- `TASK_VUS` (default `8`)
- `SHOP_VUS` (default `6`)
- `NOTIFICATION_VUS` (default `6`)
- `AI_VUS` (default `4`)
- `REQUEST_PAUSE_SECONDS` (default `0.1`; set `0` for max throughput)
- `LOGIN_EMAIL` and `LOGIN_PASSWORD` for authenticated scenarios
- `STRICT_THRESHOLDS=true` to enable hard-fail threshold checks (disabled by default)

Example:
- `GATEWAY_BASE_URL=http://localhost:8081 AI_BASE_URL=http://localhost:8082 LOGIN_EMAIL=parent@example.com LOGIN_PASSWORD=Pass123! BROWSE_VUS=10 AUTH_VUS=16 TASK_VUS=20 SHOP_VUS=15 NOTIFICATION_VUS=12 AI_VUS=8 REQUEST_PAUSE_SECONDS=0 k6 run load-tests/concurrent-business-operations.js`

Grafana/Prometheus query tip:
- `sum by (service) (rate(k6_http_reqs_total{test_type="concurrent_business_operations"}[$__rate_interval]))`

Note:
- The smoke scenario is configured to always complete and export metrics to Grafana/Prometheus.
- It does not hard-fail by strict k6 thresholds, so you can analyze performance trends even when some requests fail.
- In business scenarios, `k6` marks only `5xx` as failed requests. `4xx` can be expected when `LOGIN_EMAIL` / `LOGIN_PASSWORD` are not set.
- By default business scenarios do not define thresholds, so `k6` run does not end with threshold-crossed error. Use `STRICT_THRESHOLDS=true` when you need quality gates.

## Visual report for screenshots

1. Run k6 with summary export:
   k6 run --summary-export load-tests/summary.json load-tests/health-smoke.js
2. Build HTML report:
   node load-tests/render-k6-report.mjs load-tests/summary.json load-tests/k6-report.html
3. Open `load-tests/k6-report.html` in browser and take screenshots.

The generated report includes:
- request count and rate
- duration metrics (avg, p95, max)
- checks pass/fail chart
- threshold status

## CI artifacts dashboard

CI now publishes a combined visual dashboard artifact:
- Artifact name: `ci-quality-dashboard`
- Main file: `artifacts/ci-dashboard.html`

The dashboard includes:
- unit/integration/architecture test pass-fail diagrams
- frontend lint and test snapshot
- load test metrics snapshot (requests, req/s, avg/p95, checks)
