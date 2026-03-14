using System.Diagnostics.CodeAnalysis;
namespace UserService.Application.Dto.User;

[ExcludeFromCodeCoverage]

public record UserProfileResponse(
    UserDto User,
    UserProfileDto Profile,
    FamilyDto? Family,
    SubscriptionDto? Subscription = null);


