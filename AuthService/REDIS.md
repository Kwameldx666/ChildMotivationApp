🔹 Вариант 2 — Redis (production / Docker-friendly)

Если ты в Docker (что у тебя так и есть), лучше Redis.

Регистрация (в `AuthService.Infrastructure.Extensions.InfrastructureExtensions`):

```csharp
services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = configuration.GetConnectionString("Redis") ?? configuration["Redis:Configuration"];
    options.InstanceName = "auth:";
});
```

appsettings.json (пример):

```json
{
  "ConnectionStrings": {
    "Redis": "redis:6379"
  }
}
```

docker-compose.yml (пример):

```yaml
services:
  redis:
    image: redis:7
    ports:
      - "6379:6379"

  authservice:
    depends_on:
      - redis
    environment:
      ConnectionStrings__Redis: ${REDIS_CONNECTIONSTRING:-redis:6379}
```

Примечания:
- Использование `ConnectionStrings:Redis` упрощает передачу строки подключения в контейнерах и в облаке.
- `InstanceName` помогает изолировать ключи, если один Redis используется для нескольких приложений.
