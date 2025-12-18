<!-- cspell:disable -->
# API Endpoints (для future development)

## Authentication
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `POST /api/auth/logout` - Выход
- `GET /api/auth/me` - Текущий пользователь

## Tasks
- `GET /api/tasks` - Список задач
- `POST /api/tasks` - Создание задачи
- `PUT /api/tasks/:id` - Редактирование
- `DELETE /api/tasks/:id` - Удаление
- `POST /api/tasks/:id/complete` - Отметить выполненной

## Rewards
- `GET /api/rewards` - Список наград
- `POST /api/rewards` - Создание награды
- `PUT /api/rewards/:id` - Редактирование
- `DELETE /api/rewards/:id` - Удаление
- `POST /api/rewards/:id/purchase` - Покупка награды

## AI
- `POST /api/ai/task-suggestions` - Предложения задач
- `POST /api/ai/reward-suggestions` - Идеи наград
- `POST /api/ai/chat` - Чат с ИИ
- `GET /api/ai/analytics` - Аналитика от ИИ

## Analytics
- `GET /api/analytics/overview` - Обзор семьи
- `GET /api/analytics/user/:id` - Статистика пользователя
- `GET /api/analytics/leaderboard` - Таблица лидеров
<!-- cspell:enable -->
