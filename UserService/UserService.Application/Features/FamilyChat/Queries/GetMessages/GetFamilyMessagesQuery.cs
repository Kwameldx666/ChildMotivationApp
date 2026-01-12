using MediatR;
using UserService.Application.Dto.FamilyChat;

namespace UserService.Application.Features.FamilyChat.Queries.GetMessages;

public record GetFamilyMessagesQuery(
    string FamilyId,
    int Limit = 50,
    DateTime? Before = null
) : IRequest<List<FamilyMessageDto>>;
