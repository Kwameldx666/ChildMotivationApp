using AuthService.Contracts;
using AuthService.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSingleton<IAuthRegistrationService, InMemoryAuthRegistrationService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.MapPost("/api/auth/register", (RegisterRequest request, IAuthRegistrationService service) =>
    {
        try
        {
            var response = service.Register(request);
            return Results.Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return Results.Conflict(new { message = ex.Message });
        }
    })
    .WithName("RegisterUser")
    .Produces<AuthResponse>(StatusCodes.Status200OK)
    .Produces(StatusCodes.Status409Conflict);

app.Run();