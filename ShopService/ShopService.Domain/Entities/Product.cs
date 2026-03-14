using System.Diagnostics.CodeAnalysis;

namespace ShopService.Domain.Entities;

[ExcludeFromCodeCoverage]
public class Product
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Premium поля
    public bool IsPremium { get; set; } = false;                    // Требуется Premium подписка
    public string? RequiredTier { get; set; }                       // basic, premium, family
    public string? Category { get; set; }                           // electronics, books, toys, experiences, etc.
    public string? ImageUrl { get; set; }                           // URL изображения награды
    public int? RecommendedAge { get; set; }                        // Рекомендуемый возраст
    public bool IsExclusive { get; set; } = false;                  // Эксклюзивная награда
}

