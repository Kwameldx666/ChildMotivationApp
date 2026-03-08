using System.ComponentModel.DataAnnotations;

namespace Gateway.Application.Features.Auth.DTOs;

public record RegisterFamily(
    [StringLength(64)]
    string? Code,
    [StringLength(128)]
    string? Name,
    [StringLength(128)]
    string? Emblem
);