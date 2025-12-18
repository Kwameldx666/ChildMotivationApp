<!-- cspell:disable -->
# FamilyQuest - Архитектура системы

## Frontend code structure

The frontend uses a `src/`-first layout to keep application code in one place.

- `src/app` – Next.js App Router entry (`layout.tsx`, `page.tsx`, providers)
- `src/components` – UI + screen components (shadcn/ui in `src/components/ui`)
- `src/features` – feature modules (auth, app state, etc.)
- `src/store` – Redux store setup + typed hooks
- `src/api` – API client helpers (`apiClient`)
- `src/hooks` – shared hooks (used by UI kit)
- `src/lib` – shared utilities (e.g. `cn`)
- `src/routes` – route config/guards (future use)
- `src/services` – legacy services (keep only if used)

## Обзор проекта

FamilyQuest - это полнофункциональное приложение для управления семейными задачами и наградами с встроенным ИИ-помощником и геймификацией.

## Структура приложения

### 1. Authentication & Onboarding
- **Splash Screen** - загрузочный экран с анимацией
- **Welcome Screen** - приветствие с описанием возможностей
- **Auth Screen** (в том числе Auth Screen Enhanced с ИИ)
  - Credentials step (Email + Пароль с биометрией)
  - Role Selection (Родитель/Ребёнок) с ИИ-подсказками
  - Parent Family Creation (создание семьи с ИИ-генератором имён)
  - Child Profile Setup (профиль ребёнка с выбором аватара)
  - Demo Mode для быстрого тестирования

### 2. Parent Dashboard
**6 основных вкладок:**

1. **Tasks** - управление задачами
   - Создание, редактирование, удаление
   - ИИ-генератор задач
   - Просмотр выполнения с фото/видео
   - Модальные окна для редактирования

2. **Rewards** - система наград
   - ИИ-генератор наград
   - Проверка баланса (слишком дешёвая/сложная?)
   - Просмотр популярности наград

3. **Analytics** - аналитика семьи
   - Графики активности
   - Статистика выполнения
   - Рейтинг детей
   - Анализ от ИИ

4. **Children Management** - управление профилями
   - Добавление детей
   - Редактирование профилей
   - Отключение уведомлений
   - Удаление пользователей

5. **Task Templates** - шаблоны задач
   - 8 встроенных шаблонов
   - Пользовательские шаблоны
   - ИИ авто-создание по описанию
   - ИИ сортировка по популярности

6. **Settings** - настройки
   - Уведомления и ночной режим
   - Оформление (темная/светлая тема)
   - Информация о семье и коде
   - Опасные действия (очистка данных)

### 3. Child Dashboard
**6 основных вкладок:**

1. **My Tasks** - мои задачи
   - Список активных задач
   - Выполнение с фото/чек-листом
   - ИИ-подсказки по выполнению
   - Свайп-действия (вправо - выполнено, влево - детали)

2. **Daily Missions** - ежедневные миссии
   - Дневные (4 типа)
   - Недельные (2 типа)
   - ИИ генерирует новые миссии каждый день
   - Прогресс и награды

3. **Achievements** - достижения
   - Дерево достижений с анимациями
   - 15+ различных достижений
   - Разблокирование по условиям
   - ИИ объяснения что нужно сделать

4. **Sticker Collection** - коллекция стикеров
   - 4 серии (32 стикера)
   - ИИ генерация своих стикеров
   - Режимы: животные, роботы, фэнтези, эмодзи

5. **Reward Shop** - магазин наград
   - Покупка за заработанные очки
   - ИИ-подбор наград
   - "Рулетка наград" с скидками
   - Фиксированная плашка с очками

6. **Profile** - профиль
   - Информация о ребёнке
   - Статистика (уровень, XP, очки)
   - История XP прироста
   - Мотивационные сообщения от ИИ

### 4. Fixed HUD (Фиксированный Header)
- Остаётся вверху при скролле
- Компактифицируется при прокрутке
- Показывает: аватар, имя, уровень, XP, очки, серия
- Выпадающее меню профиля

### 5. Общие компоненты (для обеих ролей)
- **Task Calendar** - календарь с цветовой кодировкой
- **Activity Feed** - лента активности семьи
- **Leaderboard** - таблица лидеров с трендами
- **Family Goals** - семейные цели и наблюдения

### 6. Дополнительные страницы (10 шт)
1. **AI Chat Page** - полноценный чат с ИИ
2. **Parental Control** - ночной режим, лимиты времени/покупок
3. **Family Timeline** - полная история семьи
4. **Reward History** - история покупок наград
5. **XP Breakdown** - анализ прироста опыта
6. **Notifications Center** - центр уведомлений
7. **Update History** - история изменений задач
8. **Bulletin Board** - доска объявлений и заметок
9. **Child Motivational** - персональная мотивация от ИИ
10. **Parent AI Insights** - ИИ-аналитика для родителей

### 7. Модальные окна
- **Task Details Modal** - просмотр и выполнение задачи (фото/чек-лист)
- **Task Edit Modal** - редактирование задачи (название, описание, сложность, награды)
- **Task Delete Modal** - подтверждение удаления
- **Avatar Picker Modal** - выбор аватара (20+ вариантов)
- **AI Helper Modal** - советы от ИИ

## Управление состоянием (State Management)

Приложение использует React State и localStorage для персистентности:

```typescript
interface UserProfile {
  name: string
  lastName: string
  age?: number
  avatar: string
  role: "parent" | "child"
}

interface AuthUser {
  id: string
  email: string
  name: string
  lastName: string
}

// localStorage ключи:
localStorage.setItem("familyapp_current_user", JSON.stringify(authUser))
localStorage.setItem("familyapp_users", JSON.stringify(allUsers))
localStorage.setItem(`familyapp_profile_${userId}`, JSON.stringify(profile))
localStorage.setItem(`familyapp_family_${userId}`, JSON.stringify(familyData))
```

## ИИ-функции

### 1. AI Task Suggestions
- Анализирует возраст детей
- Предлагает подходящие задачи
- Проверяет баланс наград

### 2. AI Family Name Generator
- 5 вариантов имён семьи
- Подбор эмблем
- Модальное окно с выбором

### 3. AI Password Strength Checker
- Подсказка о надёжности
- Рекомендации по улучшению

### 4. AI Role Recommendation
- Рекомендация роли по возрасту
- Объяснение различий

### 5. AI Task Helper
- Советы по выполнению задачи
- Примеры фото
- Пошаговые инструкции

### 6. AI Chat Assistant
- Полноценный чат
- Популярные вопросы
- Контекстные ответы

### 7. AI Analytics
- Анализ мотивации детей
- Рекомендации по задачам
- Прогнозы и тренды

## Поток аутентификации

### Для новых пользователей:

**Родитель:**
```
Splash (2 сек) → Welcome → Auth:Credentials → Auth:Role → Auth:Family Creation → Parent Dashboard
```

**Ребёнок:**
```
Splash (2 сек) → Welcome → Auth:Credentials → Auth:Role → Auth:Profile → Auth:Family Code → Child Dashboard
```

**Демо режим:**
```
Welcome → Демо кнопка → Child Dashboard (с предзаполненными данными)
```

### Для существующих пользователей:
```
Splash (2 сек) → Welcome → Auth:Credentials → Dashboard (автоматически)
```

## Компоненты UI
- shadcn/ui компоненты (Button, Card, Dialog, Input, Textarea, Tabs, etc.)
- Lucide React иконки
- Tailwind CSS стили
- Кастомные анимации

## Безопасность
- Email/пароль хранятся в localStorage (для демо)
- Каждый пользователь видит только свои данные
- Коды семьи - 6-буквенные случайные строки
- Row Level Security рекомендуется для production

## Производительность
- Ленивая загрузка компонентов
- Оптимизация изображений
- Кэширование данных в localStorage
- Минимизация ре-рендеров

## Расширение функционала
- Интеграция с реальной БД (Supabase, PostgreSQL)
- Push уведомления
- Voice commands
- Экспорт статистики
- Интеграция с календарём
- API для мобильного приложения
