# Обновление сортировки задач

## Что изменено:

### Backend (TaskService):
1. **Добавлено поле `UpdatedAt`** в TaskItem.cs
   - Автоматически обновляется при любых изменениях задачи
   - Отслеживает время последнего обновления

2. **Обновлена сортировка** в TaskRepository.cs:
   - Невыполненные задачи (Completed = false) показываются сверху
   - Выполненные задачи (Completed = true) показываются снизу
   - Внутри каждой группы сортировка по дате обновления (UpdatedAt) или создания (CreatedAt)

3. **Обновлены DTO и маппинги** для передачи UpdatedAt на фронтенд

### Frontend:
- Добавлено поле `updatedAt` в интерфейс TaskDto

## Как применить изменения:

### Шаг 1: Создать миграцию и пересобрать
Выполните PowerShell скрипт:
```powershell
.\update-task-sorting.ps1
```

Или вручную:
```powershell
cd TaskService/TaskService.Api

dotnet ef migrations add AddUpdatedAtToTasks `
  --project ../TaskService.Persistence/TaskService.Persistence.csproj `
  --startup-project TaskService.Api.csproj `
  --context TaskDbContext `
  --output-dir ../TaskService.Persistence/Migrations

cd ../..

docker-compose up -d --build task-service
```

### Шаг 2: Проверка
После пересборки:
1. Откройте приложение
2. Список задач теперь показывает:
   - ✅ Невыполненные задачи вверху (самые свежие первыми)
   - ✅ Выполненные задачи внизу
   - ✅ Сортировка по дате последнего обновления

## Логика сортировки:
- `Completed = false` (невыполненные) → OrderBy = 0 → вверху списка
- `Completed = true` (выполненные) → OrderBy = 1 → внизу списка
- Затем по убыванию: UpdatedAt ?? CreatedAt (самые свежие первыми)
