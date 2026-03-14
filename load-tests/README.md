# Load Tests

This folder contains k6-based load tests.

## Local run

1. Start one API service, for example NotificationService:
   dotnet run --project NotificationService/NotificationService.Api/NotificationService.Api.csproj --urls http://localhost:8085
2. Run k6 test:
   k6 run load-tests/health-smoke.js

Optional environment variable:
- BASE_URL: target API base URL, default is http://localhost:8085

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
