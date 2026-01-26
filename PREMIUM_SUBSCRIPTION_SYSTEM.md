# Система Premium Подписок

## Обзор
Реализована полная система платного контента с несколькими уровнями подписки для родителей и детей. Система включает управление подписками, премиум награды в магазине и ограничение доступа к функциям.

---

## 📋 Тарифные планы

### 🆓 Бесплатный (Free)
**Цена:** 0 ₽/мес

**Возможности:**
- ✅ До 2 детей
- ✅ До 10 задач в день
- ✅ Базовые награды
- ✅ Семейный чат
- ✅ Обычная поддержка

**Ограничения:**
- ❌ Без AI помощника
- ❌ Без продвинутой аналитики
- ❌ Без кастомных наград

---

### ⚡ Базовый (Basic)
**Цена:** 299 ₽/мес | 3 059 ₽/год (скидка 15%)

**Возможности:**
- ✅ До 5 детей
- ✅ До 50 задач в день
- ✅ **AI помощник для задач**
- ✅ Все базовые награды
- ✅ Персонализированные рекомендации
- ✅ Email поддержка

**Для кого:**
Активные семьи, которые хотят использовать AI для создания задач

---

### 👑 Премиум (Premium) 
**Цена:** 599 ₽/мес | 6 119 ₽/год (скидка 15%)

**🌟 ЛУЧШЕЕ ПРЕДЛОЖЕНИЕ**

**Возможности:**
- ✅ До 10 детей
- ✅ До 100 задач в день
- ✅ **Продвинутый AI помощник**
- ✅ **Детальная аналитика прогресса**
- ✅ **Кастомные награды и задачи**
- ✅ **Эксклюзивные премиум награды**
- ✅ **Приоритетная поддержка 24/7**
- ✅ **Офлайн режим**

**Для кого:**
Семьи, которым нужен полный контроль и максимум возможностей

---

### 👨‍👩‍👧‍👦 Семейный (Family)
**Цена:** 899 ₽/мес | 9 179 ₽/год (скидка 15%)

**Возможности:**
- ✅ **Неограниченно детей**
- ✅ **Неограниченно задач**
- ✅ Все функции Premium
- ✅ **Семейный доступ (до 10 родителей)**
- ✅ **Персональный менеджер**
- ✅ **Кастомная интеграция**
- ✅ **Расширенная аналитика для всей семьи**
- ✅ **Приоритетная разработка функций**

**Для кого:**
Большие семьи и семьи с особыми потребностями

---

## 🎁 Premium Награды

### Новые поля в Product

```typescript
interface ProductDto {
  // ... базовые поля
  isPremium?: boolean              // Требуется Premium подписка
  requiredTier?: string | null     // 'basic', 'premium', 'family'
  category?: string | null         // 'electronics', 'books', 'toys', etc.
  imageUrl?: string | null         // URL изображения награды
  recommendedAge?: number | null   // Рекомендуемый возраст
  isExclusive?: boolean           // Эксклюзивная награда
}
```

### Категории наград

1. **🎮 Электроника** (Electronics)
   - Игровые консоли
   - Планшеты
   - Наушники
   - **Premium:** VR-гарнитуры, смартфоны

2. **📚 Книги и обучение** (Books)
   - Художественные книги
   - Развивающие пособия
   - **Premium:** Онлайн курсы, мастер-классы

3. **🧸 Игрушки** (Toys)
   - Конструкторы
   - Настольные игры
   - **Premium:** Коллекционные модели, роботы

4. **🎨 Творчество** (Creative)
   - Наборы для рисования
   - Музыкальные инструменты
   - **Premium:** Профессиональные наборы

5. **⭐ Впечатления** (Experiences)
   - Поход в кино
   - Аквапарк
   - **Premium:** Тематические парки, квест-комнаты

6. **🎯 Эксклюзивные** (Exclusive)
   - Доступны только для Premium+
   - Ограниченное количество
   - Особые условия

---

## 💻 Backend Модели

### UserSubscription Entity

```csharp
public class UserSubscription
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public SubscriptionTier Tier { get; set; }      // Free, Basic, Premium, Family
    public SubscriptionStatus Status { get; set; }   // Active, Expired, Cancelled
    
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool AutoRenew { get; set; }
    public decimal PricePerMonth { get; set; }
    
    // Лимиты и функции
    public int MaxChildren { get; set; }
    public int MaxTasksPerDay { get; set; }
    public bool HasAIAssistant { get; set; }
    public bool HasAdvancedAnalytics { get; set; }
    public bool HasCustomRewards { get; set; }
    public bool HasPrioritySupport { get; set; }
    public bool HasFamilySharing { get; set; }
    public bool HasOfflineMode { get; set; }
    
    // Методы проверки
    public bool IsActive()
    public bool HasFeature(string featureName)
}
```

### SubscriptionFactory

Фабрика для создания подписок с правильными настройками:

```csharp
var subscription = SubscriptionFactory.CreateSubscription(
    userId: userId,
    tier: SubscriptionTier.Premium,
    durationMonths: 12
);
```

---

## 🎨 Frontend Компоненты

### PremiumPricing Component

Компонент для отображения тарифных планов:

```tsx
import PremiumPricing from '@/components/premium-pricing'

<PremiumPricing 
  currentTier="free"
  onSelectTier={(tierId) => console.log('Selected:', tierId)}
/>
```

**Функции:**
- ✨ Красивые градиентные карточки
- 🏆 Бейдж "Лучшее предложение"
- ✅ Индикатор текущего тарифа
- 📊 Сравнение функций
- 💰 Отображение скидки при годовой оплате

### RewardsShop Updates

Обновлённый магазин с поддержкой премиум наград:

**Новые бейджи:**
- 👑 **Premium** - для премиум наград
- ⭐ **Эксклюзив** - для эксклюзивных наград
- 📦 **Категория** - отображение категории товара

---

## 🔐 Проверка доступа

### Пример проверки в коде

```csharp
// В контроллере или сервисе
public async Task<bool> CanAccessFeature(Guid userId, string feature)
{
    var subscription = await _subscriptionStore.GetActiveAsync(userId);
    
    if (subscription == null || !subscription.IsActive())
        return false;
        
    return subscription.HasFeature(feature);
}

// Использование
if (await CanAccessFeature(userId, "ai_assistant"))
{
    // Предоставить доступ к AI помощнику
}
```

### Frontend проверка

```typescript
// Проверка доступа к функции
const hasPremium = user?.subscription?.tier !== 'free'
const canUseAI = user?.subscription?.hasAIAssistant

// Блокировка UI для не-премиум
{!hasPremium && (
  <div className="blur-sm pointer-events-none">
    <FeatureContent />
  </div>
)}
```

---

## 📊 База данных

### Миграции

**ShopService:**
```bash
cd ShopService/ShopService.Persistence
dotnet ef migrations add AddPremiumFieldsToProducts --startup-project ../ShopService.Api
```

**UserService** (когда добавите UserSubscription в DbContext):
```bash
cd UserService/UserService.Persistence
dotnet ef migrations add AddUserSubscriptions --startup-project ../UserService.Api
```

---

## 🚀 Дальнейшие шаги

### Обязательно нужно добавить:

1. **API для подписок в UserService**
   - `GET /api/subscription/me` - текущая подписка
   - `POST /api/subscription/subscribe` - оформить подписку
   - `POST /api/subscription/cancel` - отменить подписку
   - `GET /api/subscription/plans` - получить список тарифов

2. **Интеграция с платёжной системой**
   - ЮКassa / CloudPayments / Stripe
   - Webhook для обработки платежей
   - Автопродление подписок

3. **Проверка лимитов**
   - Middleware для проверки лимитов задач
   - Ограничение количества детей
   - Блокировка премиум функций

4. **Уведомления**
   - Email при окончании подписки
   - Напоминания о продлении
   - Приветственные письма для новых подписчиков

---

## 💡 Примеры использования

### Создание премиум награды

```typescript
// В компоненте родителя
const createPremiumReward = async () => {
  await createProduct({
    name: "PlayStation 5",
    description: "Игровая консоль последнего поколения",
    price: 50000,
    stock: 1,
    isPremium: true,
    requiredTier: "premium",
    category: "electronics",
    imageUrl: "/images/ps5.jpg",
    recommendedAge: 12,
    isExclusive: true
  })
}
```

### Проверка доступа к награде

```typescript
const canPurchase = (product: ProductDto, userTier: string) => {
  if (!product.isPremium) return true
  
  if (product.requiredTier === 'basic') {
    return ['basic', 'premium', 'family'].includes(userTier)
  }
  
  if (product.requiredTier === 'premium') {
    return ['premium', 'family'].includes(userTier)
  }
  
  return userTier === product.requiredTier
}
```

---

## 📈 Монетизация

### Расчёт доходности

**При 1000 активных семей:**

- 700 Free (0₽) = 0₽
- 200 Basic (299₽) = 59 800₽/мес
- 80 Premium (599₽) = 47 920₽/мес  
- 20 Family (899₽) = 17 980₽/мес

**Итого:** ~125 700₽/мес или ~1 508 400₽/год

**При годовой оплате (скидка 15%):**
~1 282 140₽/год

---

## 🎯 Ключевые преимущества

✅ Гибкая система тарифов для разных потребностей
✅ Монетизация через премиум контент
✅ Мотивация upgrade через эксклюзивные награды
✅ Масштабируемость (от 2 детей до неограниченного количества)
✅ Дополнительная ценность через AI и аналитику
✅ Семейный доступ для больших семей
