using MediatR;
using Microsoft.EntityFrameworkCore;
using UserService.Application.Dto.FamilyChat;
using UserService.Application.Features.FamilyChat.Commands.SendMessage;
using UserService.Domain.Entities;
using UserService.Persistence.Context;

namespace UserService.Infrastructure.Features.FamilyChat;

public class SendFamilyMessageCommandHandler : IRequestHandler<SendFamilyMessageCommand, FamilyMessageDto>
{
    private readonly UserDbContext _context;

    public SendFamilyMessageCommandHandler(UserDbContext context)
    {
        _context = context;
    }

    public async Task<FamilyMessageDto> Handle(SendFamilyMessageCommand request, CancellationToken cancellationToken)
    {
        var senderId = Guid.Parse(request.SenderId);
        var sender = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == senderId, cancellationToken);

        if (sender == null)
        {
            throw new InvalidOperationException("Sender not found");
        }

        var message = new FamilyMessage
        {
            Id = Guid.NewGuid(),
            FamilyId = request.FamilyId,
            SenderId = senderId,
            Content = request.Content,
            CreatedAt = DateTime.UtcNow,
            IsRead = false,
            MentionedTaskId = request.MentionedTaskId,
            ReplyToMessageId = request.ReplyToMessageId
        };

        _context.FamilyMessages.Add(message);
        await _context.SaveChangesAsync(cancellationToken);

        return new FamilyMessageDto(
            message.Id,
            message.FamilyId,
            message.SenderId.ToString(),
            sender.UserName ?? "Unknown",
            sender.Avatar ?? "",
            message.Content,
            message.CreatedAt,
            message.IsRead,
            message.MentionedTaskId,
            null, // Task title will be filled by Gateway
            message.ReplyToMessageId
        );
    }
}
