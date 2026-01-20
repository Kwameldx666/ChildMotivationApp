using MediatR;

namespace TaskService.Application.Features.Analytics.Queries.GetAnalytics;

public sealed record GetAnalyticsQuery(
    string UserId,
    int WindowDays = 30
) : IRequest<AnalyticsDto>;
