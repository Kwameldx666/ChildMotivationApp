using System.ComponentModel.DataAnnotations;

namespace Gateway.Application.Features.User.DTOs;

public record ChangeSubscriptionRequest(
    [property: Required(ErrorMessage = "Тариф обязателен")]
    [property: RegularExpression("^(Free|Basic|Premium|Family)$", ErrorMessage = "Тариф должен быть: Free, Basic, Premium или Family")]
    string Tier,
    bool AutoRenew = true
);