<!-- cspell:disable -->
# API Endpoints (для future development)

> 💡 **Важно:** все запросы к задачам должны идти через **Gateway** (например, `GET /api/tasks` → Gateway → TaskService).

## Authentication
- `POST /api-gateway/auth/register` - Регистрация
- `POST /api-gateway/auth/login` - Вход
- `POST /api-gateway/auth/logout` - Выход
- `GET /api-gateway/auth/me` - Текущий пользователь

## Tasks
- `GET /api-gateway/tasks` - Список задач
- `POST /api-gateway/tasks` - Создание задачи
- `PUT /api-gateway/tasks/:id` - Редактирование
- `DELETE /api-gateway/tasks/:id` - Удаление
- `POST /api-gateway/tasks/:id/complete` - Отметить выполненной

## Gamification
- `GET /api-gateway/missions?recurrence=daily` - Список миссий (по умолчанию все типы)
- `POST /api-gateway/missions/:id/progress` - Обновить прогресс миссии
- `GET /api-gateway/achievements` - Список достижений
- `POST /api-gateway/achievements/:id/progress` - Обновить прогресс достижения

## Rewards
- `GET /api-gateway/rewards` - Список наград
- `POST /api-gateway/rewards` - Создание награды
- `PUT /api-gateway/rewards/:id` - Редактирование
- `DELETE /api-gateway/rewards/:id` - Удаление
- `POST /api-gateway/rewards/:id/purchase` - Покупка награды

## AI
- `POST /api-gateway/ai/task-suggestions` - Предложения задач
- `POST /api-gateway/ai/reward-suggestions` - Идеи наград
- `POST /api-gateway/ai/chat` - Чат с ИИ
- `GET /api-gateway/ai/analytics` - Аналитика от ИИ
> Все AI-вызовы проксируются в выделенный **AiService** (порт 8095), поэтому сервис можно масштабировать независимо от остальных API.

## Analytics
- `GET /api-gateway/analytics/overview` - Обзор семьи
- `GET /api-gateway/analytics/user/:id` - Статистика пользователя
- `GET /api-gateway/analytics/leaderboard` - Таблица лидеров
<!-- cspell:enable -->
