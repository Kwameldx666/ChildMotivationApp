using System;
using System.Collections.Generic;
using MediatR;
using UserService.Application.Dto.User;

namespace UserService.Application.Features.Profile.GetFamilyMembers;

public record GetFamilyMembersQuery(Guid UserId) : IRequest<IReadOnlyCollection<FamilyMemberDto>>;
