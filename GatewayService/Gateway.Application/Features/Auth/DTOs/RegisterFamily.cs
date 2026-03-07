using System.ComponentModel.DataAnnotations;

namespace Gateway.Application.Features.Auth.DTOs;

public record RegisterFamily(
    [property: StringLength(64)]
    string? Code,
    [property: StringLength(128)]
    string? Name,
    [property: StringLength(128)]
    string? Emblem
);