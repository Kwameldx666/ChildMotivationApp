# Family Hub - Платформа для управления семьей

Современная микросервисная платформа для организации семейной жизни с AI-помощником, чатом, задачами и магазином наград.

## 🚀 Технологический стек

### Backend
- **.NET 10.0** - ASP.NET Core Web API
- **Clean Architecture** - разделение слоев (API, Application, Domain, Infrastructure, Persistence)
- **PostgreSQL 15** - основная база данных
- **Redis 7** - кэширование и распределенные сессии
- **Entity Framework Core** - ORM

### Frontend
- **Next.js 15** - React framework с App Router
- **TypeScript** - типизированный JavaScript
- **TanStack Query** - управление серверным состоянием
- **shadcn/ui + Tailwind CSS** - современный UI
- **Zustand** - глобальное состояние

## 📦 Архитектура микросервисов

Проект состоит из 8 независимых сервисов:

### 1. **AuthService** (порт 8081)
- OAuth 2.0 авторизация (Google)
- JWT токены
- Управление ролями (Parent/Child)
- Redis для распределенных сессий

### 2. **UserService** (порт 8082)
- Профили пользователей
- Управление семьями
- Связь родитель-ребенок

### 3. **TaskService** (порт 8083)
- Создание и назначение задач
- Система вознаграждений (баллы)
- Статусы выполнения

### 4. **ShopService** (порт 8084)
- Каталог наград
- Покупка за баллы
- История транзакций

### 5. **NotificationService** (порт 8085)
- Внутренние уведомления
- Система событий

### 6. **AiService** (порт 8086)
- AI-помощник для детей
- Персонализированные советы
- Помощь с задачами

### 7. **GatewayService** (порт 8080)
- API Gateway
- Маршрутизация запросов
- CORS и безопасность

### 8. **Frontend** (порт 3000)
- Web-интерфейс
- Дашборды для родителей и детей
- Real-time чат с семьей

## 🛠 Быстрый старт

### Предварительные требования
- Docker & Docker Compose
- Node.js 20+ (для фронтенда)
- .NET 8 SDK (для разработки бэкенда)

### Запуск всего проекта

```bash
# Запуск всех сервисов через Docker Compose
docker-compose up --build

# Запуск в фоновом режиме
docker-compose up -d --build
```

После запуска доступны:
- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8080
- **PostgreSQL**: localhost:5433
- **Redis**: localhost:6379

### Остановка

```bash
docker-compose down

# С удалением volumes (очистка БД)
docker-compose down -v
```

## 🔑 Переменные окружения

Основные переменные для настройки:

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

## 📁 Структура проекта

```
project code/
├── docker-compose.yml          # Оркестрация всех сервисов
├── .dockerignore              # Исключения для Docker
│
├── Frontend/                   # Next.js приложение
│   ├── src/
│   │   ├── app/               # App Router страницы
│   │   ├── components/        # React компоненты
│   │   ├── features/          # Фичи (auth, tasks, etc)
│   │   └── store/             # Zustand store
│   └── Dockerfile
│
├── AuthService/               # Сервис авторизации
│   ├── AuthService.Api/       # API слой
│   ├── AuthService.Application/   # Бизнес-логика
│   ├── AuthService.Domain/    # Доменные модели
│   └── AuthService.Infrastructure/ # OAuth, JWT
│
├── UserService/               # Сервис пользователей
├── TaskService/               # Сервис задач
├── ShopService/               # Сервис магазина
├── NotificationService/       # Сервис уведомлений
├── AiService/                 # AI-помощник
└── GatewayService/            # API Gateway
```

## ✨ Основные возможности

### Для родителей
- 👨‍👩‍👧‍👦 Создание семьи и приглашение детей по ссылке
- 📋 Назначение задач с вознаграждениями
- 💬 Групповой чат со всеми детьми
- 💬 Приватные чаты с каждым ребенком
- 🎁 Создание наград в магазине
- 📊 Просмотр прогресса детей

### Для детей
- ✅ Выполнение задач и получение баллов
- 🛍 Покупка наград за баллы
- 💬 Общение с родителями
- 🤖 AI-помощник для советов
- 📈 Отслеживание своих достижений

## 🔄 API Gateway маршруты

```
/auth-service/*       → AuthService:8081
/user-service/*       → UserService:8082
/task-service/*       → TaskService:8083
/shop-service/*       → ShopService:8084
/notification-service/* → NotificationService:8085
/ai-service/*         → AiService:8086
```

## 🎨 Дизайн-система

Frontend использует современный gradient-дизайн:
- Фиолетово-синие градиенты
- Glassmorphism эффекты
- Анимации и микроинтеракции
- Адаптивный дизайн

## 🔐 Безопасность

- JWT токены с истечением
- HTTP-only cookies
- CORS настройка
- OAuth 2.0 flow
- Role-based доступ (Parent/Child)

## 📝 Разработка

### Backend (любой сервис)
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

## 🐛 Отладка

### Логи Docker
```bash
docker-compose logs -f [service_name]
docker-compose logs -f auth-service
```

### Подключение к PostgreSQL
```bash
docker exec -it postgres_db psql -U app_owner_net -d db_net
```

### Подключение к Redis
```bash
docker exec -it redis redis-cli
```

## 📚 Дополнительная информация

### Clean Architecture слои

Каждый .NET сервис следует Clean Architecture:

1. **Domain** - Entities, Value Objects
2. **Application** - Use Cases, DTOs, Interfaces
3. **Infrastructure** - External services, APIs
4. **Persistence** - EF Core, Database
5. **Api** - Controllers, Middleware

### База данных

Миграции применяются автоматически при старте сервисов.

```bash
# Создание новой миграции
cd AuthService/AuthService.Persistence
dotnet ef migrations add MigrationName

# Применение миграций
dotnet ef database update
```

## 🤝 Вклад в проект

Проект создан как дипломная работа. Структура поддерживает расширение новыми микросервисами.

## 📄 Лицензия

Образовательный проект.

---

**Автор**: Kwameldx666  
**Версия**: 1.0  
**Дата**: Январь 2026
