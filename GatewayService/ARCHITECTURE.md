# Gateway Service Architecture

## Overview
Gateway Service acts as the single entry point (API Gateway) for all client requests, routing them to appropriate downstream microservices.

## Project Structure

### Gateway.Api
- **Controllers** (moved to Features/Controllers): HTTP endpoints organized by domain
- **Middlewares**: Cross-cutting concerns (correlation ID, logging, exception handling)
- **Extensions**: DI registration for presentation layer
- **Authorization**: Custom authorization handlers and policies

### Gateway.Application
- **Features**: Organized by bounded context (Auth, User, Shop, Task, Ai)
  - **Commands**: Write operations (future use with MediatR)
  - **Queries**: Read operations (future use with MediatR)
  - **DTOs**: Data transfer objects per feature
- **Abstractions**: Service client interfaces for downstream services

### Gateway.Domain
- **Entities**: Core domain entities (if needed)
- **ValueObjects**: Immutable value objects (ServiceEndpoint)
- **Enums**: Domain enumerations (ServiceStatus, RequestPriority)

### Gateway.Infrastructure
- **Services/Clients**: HTTP client implementations for downstream services
- **Options**: Strongly-typed configuration classes
- **Policies**: Polly resilience policies (retry, circuit breaker, timeout)
- **Extensions**: DI registration for infrastructure layer
- **Handlers**: Message handlers (auth forwarding, etc.)
- **Mappings**: Mapster configurations

### Gateway.Common
- **Constants**: Shared constants
- **HttpUrls**: Endpoint URL templates
- **ResultPattern**: Result/Error handling primitives

## Architecture Principles

### Dependency Flow
```
Api → Application → Domain
      ↑
Infrastructure
```

- **Api** depends on Application and Infrastructure (for DI registration only)
- **Application** depends on Domain and Common (interfaces only)
- **Infrastructure** depends on Application (for interfaces) and Domain
- **Domain** has no dependencies (pure business logic)
- **Common** has no dependencies (shared primitives)

### Key Design Patterns
1. **Gateway Pattern**: Single entry point for all client requests
2. **Repository Pattern**: Service clients abstract HTTP communication
3. **Options Pattern**: Strongly-typed configuration
4. **Retry Pattern**: Automatic retry with exponential backoff (Polly)
5. **Circuit Breaker**: Fail-fast when services are down
6. **Result Pattern**: Explicit error handling without exceptions

### Configuration
Services are configured via `appsettings.json`:
```json
"Services": {
  "Auth": {
    "BaseUrl": "http://localhost:7265",
    "TimeoutSeconds": 30,
    "MaxRetries": 3
  }
}
```

### Resiliency
All HTTP clients use Polly policies:
- **Retry Policy**: 3 retries with exponential backoff
- **Circuit Breaker**: Opens after 5 failures, breaks for 30s
- **Timeout Policy**: 30s default (configurable per service)

### Cross-Cutting Concerns
- **Correlation ID**: Tracks requests across services
- **Request Logging**: Logs all incoming/outgoing requests with duration
- **Exception Handling**: Global exception handler
- **Authentication**: JWT Bearer token forwarding to downstream services

## Future Improvements
1. Add MediatR for CQRS pattern implementation
2. Add FluentValidation for request validation
3. Add health checks for downstream services
4. Add distributed caching (Redis)
5. Add rate limiting per client
6. Add API versioning
7. Add OpenTelemetry for distributed tracing
8. Add unit/integration tests
