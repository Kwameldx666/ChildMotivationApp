using System.Net.Http.Headers;
using Microsoft.AspNetCore.Http;

namespace Gateway.Infrastructure.Handlers;

public class AuthorizationForwardingHandler(IHttpContextAccessor httpContextAccessor) : DelegatingHandler
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        var authorizationHeader = httpContextAccessor.HttpContext?.Request.Headers.Authorization;

        if (!string.IsNullOrWhiteSpace(authorizationHeader))
            if (AuthenticationHeaderValue.TryParse(authorizationHeader.ToString(), out var headerValue))
                request.Headers.Authorization ??= headerValue;

        return base.SendAsync(request, cancellationToken);
    }
}