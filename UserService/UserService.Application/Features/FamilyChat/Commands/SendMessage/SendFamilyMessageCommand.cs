using MediatR;
using UserService.Application.Dto.FamilyChat;

namespace UserService.Application.Features.FamilyChat.Commands.SendMessage;

public record SendFamilyMessageCommand(
    string FamilyId,
    string SenderId,
    string Content,
    Guid? MentionedTaskId,
    string? ReplyToMessageId
) : IRequest<FamilyMessageDto>;
