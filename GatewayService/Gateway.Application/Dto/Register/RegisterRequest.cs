namespace Gateway.Application.Dto.Register;

public record RegisterRequest(
	string Email,
	string Password,
	string Role,
	RegisterProfile Profile,
	RegisterFamily Family
);