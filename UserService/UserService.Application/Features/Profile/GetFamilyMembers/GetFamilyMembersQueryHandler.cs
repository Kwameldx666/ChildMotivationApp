using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using UserService.Application.Dto.User;
using UserService.Application.Interfaces;

namespace UserService.Application.Features.Profile.GetFamilyMembers;

public class GetFamilyMembersQueryHandler(IUserProfileProvider userProfileProvider)
    : IRequestHandler<GetFamilyMembersQuery, IReadOnlyCollection<FamilyMemberDto>>
{
    public Task<IReadOnlyCollection<FamilyMemberDto>> Handle(GetFamilyMembersQuery request, CancellationToken cancellationToken)
    {
        return userProfileProvider.GetFamilyMembersAsync(request.UserId, cancellationToken);
    }
}
