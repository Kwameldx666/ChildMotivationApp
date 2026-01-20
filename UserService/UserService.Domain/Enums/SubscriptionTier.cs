namespace UserService.Domain.Enums;

/// <summary>
/// Тип премиум подписки
/// </summary>
public enum SubscriptionTier
{
    Free = 0,           // Бесплатный тариф
    Basic = 1,          // Базовый - 299 руб/мес
    Premium = 2,        // Премиум - 599 руб/мес
    Family = 3          // Семейный - 899 руб/мес
}
