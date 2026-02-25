namespace UserService.Application.Dto.User;

public record UserProfileResponse(
    UserDto User,
    UserProfileDto Profile,
    FamilyDto? Family,
    SubscriptionDto? Subscription = null);
