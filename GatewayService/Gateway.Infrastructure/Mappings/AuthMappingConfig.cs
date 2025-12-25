using Gateway.Application.Dto.Register;
using Mapster;

namespace Gateway.Infrastructure.Mappings;

public class AuthMappingConfig : IRegister
{
    public void Register(TypeAdapterConfig config)
    {
        config.NewConfig<RegisterRequest, AuthServiceRegisterRequest>()
            .Map(dest => dest.Code, src => src.Family.Code)
            .Map(d => d.Name, s => s.Profile.Name)
            .Map(d => d.LastName, s => s.Profile.LastName)
            .Map(d => d.Age, s => s.Profile.Age)
            .Map(d => d.Emblem, s => s.Family.Emblem)
            .Map(d => d.FamilyName, s => s.Family.Name)
            .MapToConstructor(true);
    }
}