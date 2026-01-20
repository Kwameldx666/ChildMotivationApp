# Система покупок и подтверждения наград

## Обзор
Реализована полная система покупки наград в магазине с возможностью подтверждения выдачи наград родителем и ребёнком.

## Новые возможности

### 1. Расширенные статусы заказов
Добавлены новые статусы для отслеживания процесса выдачи наград:

- **Pending (0)** - Ожидает оплаты
- **Paid (1)** - Оплачен (баллы списаны)
- **AwaitingDelivery (2)** - Ожидает выдачи награды
- **Delivered (3)** - Награда выдана родителем
- **Confirmed (4)** - Получение подтверждено ребёнком
- **Completed (5)** - Завершён
- **Cancelled (6)** - Отменён

### 2. Новые поля в модели Order
```csharp
public DateTime? DeliveredAt { get; set; }           // Когда награда была выдана
public string? DeliveredByUserId { get; set; }       // ID родителя, выдавшего награду
public DateTime? ConfirmedAt { get; set; }           // Когда получение было подтверждено
public string? ConfirmedByUserId { get; set; }       // ID ребёнка, подтвердившего получение
public string? DeliveryNotes { get; set; }           // Комментарии к выдаче награды
```

### 3. API Endpoints

#### Подтверждение выдачи награды (родитель)
```http
POST /shop-service/orders/{orderId}/mark-delivered
Content-Type: application/json

{
  "deliveredByUserId": "parent-user-id",
  "notes": "Выдал награду после выполнения всех задач"
}
```

#### Подтверждение получения награды (ребёнок)
```http
POST /shop-service/orders/{orderId}/confirm-received
Content-Type: application/json

{
  "confirmedByUserId": "child-user-id"
}
```

## Процесс работы

### Для ребёнка:
1. Ребёнок выбирает награду в магазине и создаёт заказ (статус: `Pending`)
2. Система списывает баллы (статус меняется на `Paid`)
3. Ребёнок ожидает, пока родитель выдаст награду
4. Когда родитель выдал награду (статус `Delivered`), ребёнок видит кнопку "Подтвердить получение"
5. После подтверждения статус меняется на `Confirmed`

### Для родителя:
1. Родитель видит все заказы детей в магазине
2. Когда заказ оплачен (статус `Paid`), появляется кнопка "Подтвердить выдачу награды"
3. Родитель может добавить комментарий при выдаче награды
4. После подтверждения статус меняется на `Delivered`
5. Родитель может видеть, когда ребёнок подтвердил получение

## Frontend компоненты

В компоненте `rewards-shop.tsx` добавлены:

1. **Отображение статусов** - красивые бейджи с иконками для каждого статуса
2. **Комментарии родителя** - отображаются в отдельной карточке если есть
3. **Кнопки подтверждения**:
   - Для родителя: "Подтвердить выдачу награды" (показывается когда статус `Paid`)
   - Для ребёнка: "Подтвердить получение" (показывается когда статус `Delivered`)

## База данных

Создана миграция `AddOrderConfirmationFields`, которая добавляет новые поля в таблицу `orders`.

Для применения миграции:
```bash
cd ShopService/ShopService.Persistence
dotnet ef database update --startup-project ../ShopService.Api
```

## Интеграция с Gateway

Новые endpoints автоматически доступны через API Gateway:
- `POST /api-gateway/shop/orders/{orderId}/mark-delivered`
- `POST /api-gateway/shop/orders/{orderId}/confirm-received`

## Примеры использования

### TypeScript/Frontend
```typescript
import { useMarkOrderAsDelivered, useConfirmOrderReceived } from '@/services/shop-queries'

// В компоненте родителя
const markAsDelivered = useMarkOrderAsDelivered()
await markAsDelivered.mutateAsync({
  id: orderId,
  payload: { 
    deliveredByUserId: parentUserId,
    notes: "Награда выдана!"
  }
})

// В компоненте ребёнка
const confirmReceived = useConfirmOrderReceived()
await confirmReceived.mutateAsync({
  id: orderId,
  payload: { confirmedByUserId: childUserId }
})
```

## Планы на будущее

- [ ] Добавить уведомления при изменении статуса заказа
- [ ] Реализовать историю изменений статусов
- [ ] Добавить возможность прикрепления фото подтверждения
- [ ] Статистика по выданным наградам
- [ ] Автоматический переход в `Completed` через N дней после `Confirmed`
