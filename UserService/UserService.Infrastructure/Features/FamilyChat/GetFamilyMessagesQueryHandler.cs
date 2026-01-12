using MediatR;
using Microsoft.EntityFrameworkCore;
using UserService.Application.Dto.FamilyChat;
using UserService.Application.Features.FamilyChat.Queries.GetMessages;
using UserService.Persistence.Context;

namespace UserService.Infrastructure.Features.FamilyChat;

public class GetFamilyMessagesQueryHandler : IRequestHandler<GetFamilyMessagesQuery, List<FamilyMessageDto>>
{
    private readonly UserDbContext _context;

    public GetFamilyMessagesQueryHandler(UserDbContext context)
    {
        _context = context;
    }

    public async Task<List<FamilyMessageDto>> Handle(GetFamilyMessagesQuery request, CancellationToken cancellationToken)
    {
        var query = _context.FamilyMessages
            .Include(m => m.Sender)
            .Where(m => m.FamilyId == request.FamilyId);

        if (request.Before.HasValue)
        {
            query = query.Where(m => m.CreatedAt < request.Before.Value);
        }

        var messages = await query
            .OrderByDescending(m => m.CreatedAt)
            .Take(request.Limit)
            .Select(m => new FamilyMessageDto(
                m.Id,
                m.FamilyId,
                m.SenderId,
                m.Sender.UserName ?? "Unknown",
                m.Sender.Avatar ?? "",
                m.Content,
                m.CreatedAt,
                m.IsRead,
                m.MentionedTaskId,
                null, // Task title will be filled by Gateway
                m.ReplyToMessageId
            ))
            .ToListAsync(cancellationToken);

        return messages.OrderBy(m => m.CreatedAt).ToList();
    }
}
