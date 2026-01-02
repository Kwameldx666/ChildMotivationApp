using System;

namespace UserService.Application.Dto.User;

public record FamilyMemberDto(
    Guid Id,
    string Role,
    string Name,
    string? LastName,
    string? Avatar,
    int? Age);
