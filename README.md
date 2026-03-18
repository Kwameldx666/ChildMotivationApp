# Family Hub - Family Management Platform

Modern microservices platform for organizing family life with AI assistant, chat, tasks, and rewards shop.

## 🚀 Technology Stack

### Backend
- **.NET 10.0** - ASP.NET Core Web API
- **Clean Architecture** - разделение слоев (API, Application, Domain, Infrastructure, Persistence)
- **PostgreSQL 15** - основная база данных
- **Redis 7** - кэширование и распределенные сессии
- **Entity Framework Core** - ORM

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - typed JavaScript
- **TanStack Query** - server state management
- **shadcn/ui + Tailwind CSS** - modern UI
- **Zustand** - global state management

## 📦 Microservices Architecture

The project consists of 8 independent services:

### 1. **AuthService** (port 8081)
- OAuth 2.0 authentication (Google)
- JWT tokens
- Role management (Parent/Child)
- Redis for distributed sessions

### 2. **UserService** (port 8082)
- User profiles
- Family management
- Parent-child relationships

### 3. **TaskService** (port 8083)
- Task creation and assignment
- Reward system (points)
- Completion statuses

### 4. **ShopService** (port 8084)
- Rewards catalog
- Point-based purchases
- Transaction history

### 5. **NotificationService** (port 8085)
- Internal notifications
- Event system

### 6. **AiService** (port 8086)
- AI assistant for children
- Personalized advice
- Task assistance

### 7. **GatewayService** (port 8080)
- API Gateway
- Request routing
- CORS and security

### 8. **Frontend** (port 3000)
- Web interface
- Dashboards for parents and children
- Real-time family chat

## 🛠 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for frontend)
- .NET 8 SDK (for backend development)

### Running the entire project

```bash
# Start all services via Docker Compose
docker-compose up --build

# Run in background mode
docker-compose up -d --build
```

After startup, available at:
- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8080
- **PostgreSQL**: localhost:5433
- **Redis**: localhost:6379
- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090

### Stopping

```bash
docker-compose down

# With volume removal (database cleanup)
docker-compose down -v
```

## 🔑 Environment Variables

Main configuration variables:

```env
# Auth Service
AUTH_JWT_SECRET=your_secret_key_at_least_32_bytes_long
AUTH_GOOGLE_CLIENT_ID=your_google_client_id
AUTH_GOOGLE_CLIENT_SECRET=your_google_client_secret
AUTH_GOOGLE_REDIRECT_URI=http://localhost:8080/auth-service/google/callback

# Database
AUTH_DB_CONNECTION=Host=postgres;Port=5432;Database=db_net;Username=app_owner_net;Password=postgres

# AI Service
OPENAI_API_KEY=your_openai_api_key
```

## 📁 Project Structure

```
project code/
├── docker-compose.yml          # Service orchestration
├── .dockerignore              # Docker exclusions
│
├── Frontend/                   # Next.js application
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   ├── components/        # React components
│   │   ├── features/          # Features (auth, tasks, etc)
│   │   └── store/             # Zustand store
│   └── Dockerfile
│
├── AuthService/               # Authentication service
│   ├── AuthService.Api/       # API layer
│   ├── AuthService.Application/   # Business logic
│   ├── AuthService.Domain/    # Domain models
│   └── AuthService.Infrastructure/ # OAuth, JWT
│
├── UserService/               # User service
├── TaskService/               # Task service
├── ShopService/               # Shop service
├── NotificationService/       # Notification service
├── AiService/                 # AI assistant
└── GatewayService/            # API Gateway
```

## ✨ Key Features

### For Parents
- 👨‍👩‍👧‍👦 Create family and invite children via link
- 📋 Assign tasks with rewards
- 💬 Group chat with all children
- 💬 Private chats with each child
- 🎁 Create rewards in shop
- 📊 View children's progress

### For Children
- ✅ Complete tasks and earn points
- 🛍 Purchase rewards with points
- 💬 Communicate with parents
- 🤖 AI assistant for advice
- 📈 Track achievements

## 🔄 API Gateway Routes

```
/auth-service/*       → AuthService:8081
/user-service/*       → UserService:8082
/task-service/*       → TaskService:8083
/shop-service/*       → ShopService:8084
/notification-service/* → NotificationService:8085
/ai-service/*         → AiService:8086
```

## 🎨 Design System

Frontend uses modern gradient design:
- Purple-blue gradients
- Glassmorphism effects
- Animations and micro-interactions
- Responsive design

## 🔐 Security

- JWT tokens with expiration
- HTTP-only cookies
- CORS configuration
- OAuth 2.0 flow
- Role-based access (Parent/Child)

## 📝 Development

### Backend (any service)
```bash
cd AuthService
dotnet restore
dotnet build
dotnet run --project AuthService.Api
```

### Frontend
```bash
cd Frontend
npm install
npm run dev
```

### Frontend demo mode (full mocks)

Frontend now has a centralized mock API layer for demo screenshots and offline showcases.

- By default, demo mode is disabled (real backend is used).
- To force enable: set `localStorage` key `familyquest:demo-mode` to `true` or `1`.
- To disable and use real backend: set `localStorage` key `familyquest:demo-mode` to `false` or `0`.
- Optional env override:
	- `NEXT_PUBLIC_DEMO_MODE=true` — always use mocks
	- `NEXT_PUBLIC_DEMO_MODE=false` — never use mocks

Example in browser console:

```js
localStorage.setItem('familyquest:demo-mode', '1') // enable
// localStorage.setItem('familyquest:demo-mode', '0') // disable
location.reload()
```

### Pre-seeded demo parent (real backend)

When services start with migrations, a demo family is created automatically in DB for realistic screenshots and testing.

- Parent login: `demo.parent@example.com`
- Password: `Demo123!`
- Family code: `DEMO2025`
- Demo children:
	- `masha.ivanova@example.com` / `Demo123!`
	- `dima.ivanov@example.com` / `Demo123!`

Seed includes:
- Extended tasks (completed, pending, and common family tasks)
- Family chat history with meaningful threaded conversation
- Subscription and shop orders with different statuses

## 📈 Monitoring (Grafana)

Grafana and Prometheus are included in `docker-compose.yml`.

### Start monitoring stack
```bash
docker-compose up -d prometheus cadvisor grafana
```

### Open Grafana
- URL: `http://localhost:3001`
- Login: `admin`
- Password: `admin`

### What is configured automatically
- Prometheus datasource is provisioned at startup.
- Dashboard `ChildMotivationApp - Containers Overview` is imported automatically.
- Dashboard `ChildMotivationApp - k6 Performance Overview` is imported automatically.
- Dashboard shows:
	- CPU usage by service
	- Memory usage by service
	- Network throughput by service
	- Prometheus target health (`up`)

### Run k6 and stream metrics to Grafana
```bash
# Start app + monitoring
docker-compose up -d --build

# Run load test and send metrics to Prometheus remote write
docker-compose --profile loadtest run --rm k6
```

After that open Grafana dashboard:
- `ChildMotivationApp - k6 Performance Overview`
- Metrics: response time (avg/p95), requests per second, error rate, active VUs.

### If dashboard shows "No data"
1. Open `http://localhost:9090/targets` and verify `prometheus` + `cadvisor` are `UP`.
2. In Grafana go to `Connections -> Data sources -> Prometheus` and click `Save & test`.
3. Make sure at least one load test run has executed: `docker-compose --profile loadtest run --rm k6`.

## 🐛 Debugging

### Docker Logs
```bash
docker-compose logs -f [service_name]
docker-compose logs -f auth-service
```

### Connect to PostgreSQL
```bash
docker exec -it postgres_db psql -U app_owner_net -d db_net
```

### Connect to Redis
```bash
docker exec -it redis redis-cli
```

## 📚 Additional Information

### Clean Architecture Layers

Each .NET service follows Clean Architecture:

1. **Domain** - Entities, Value Objects
2. **Application** - Use Cases, DTOs, Interfaces
3. **Infrastructure** - External services, APIs
4. **Persistence** - EF Core, Database
5. **Api** - Controllers, Middleware

### Database

Migrations are applied automatically on service startup.

```bash
# Create new migration
cd AuthService/AuthService.Persistence
dotnet ef migrations add MigrationName

# Apply migrations
dotnet ef database update
```

## 🤝 Contributing

Project created as a thesis work. The structure supports extension with new microservices.

## 📄 License

Educational project.

---

**Author**: Kwameldx666  
**Version**: 1.0  
**Date**: January 2026
