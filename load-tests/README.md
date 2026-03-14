# Load Tests

This folder contains k6-based load tests.

## Local run

1. Start one API service, for example NotificationService:
   dotnet run --project NotificationService/NotificationService.Api/NotificationService.Api.csproj --urls http://localhost:8085
2. Run k6 test:
   k6 run load-tests/health-smoke.js

Optional environment variable:
- BASE_URL: target API base URL, default is http://localhost:8085
