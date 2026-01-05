using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using AiService.Application.Abstractions;
using AiService.Application.Contracts;
using AiService.Infrastructure.Clients;
using Microsoft.Extensions.Logging;

namespace AiService.Infrastructure.Orchestration;

internal sealed class OpenAiOrchestrator : IAiOrchestrator
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);
    private readonly OpenAiClient _client;
    private readonly RuleBasedAiOrchestrator _fallback;
    private readonly TimeProvider _timeProvider;
    private readonly ILogger<OpenAiOrchestrator> _logger;

    public OpenAiOrchestrator(
        OpenAiClient client,
        RuleBasedAiOrchestrator fallback,
        TimeProvider timeProvider,
        ILogger<OpenAiOrchestrator> logger)
    {
        _client = client;
        _fallback = fallback;
        _timeProvider = timeProvider;
        _logger = logger;
    }

    public async Task<TaskSuggestionsResponse> GenerateTaskSuggestionsAsync(TaskSuggestionsRequest request, CancellationToken cancellationToken)
    {
        var payload = await RequestPayloadAsync<TaskSuggestionsPayload>(BuildTaskMessages(request), cancellationToken);
        if (payload?.Suggestions is { Count: > 0 })
        {
            var suggestions = payload.Suggestions
                .Select(item => item.ToModel())
                .Where(static suggestion => suggestion is not null)
                .Cast<TaskSuggestion>()
                .ToList();

            if (suggestions.Count > 0)
            {
                var tips = payload.Tips?.Where(static tip => !string.IsNullOrWhiteSpace(tip)).ToArray() ?? Array.Empty<string>();
                var summary = string.IsNullOrWhiteSpace(payload.StrategySummary)
                    ? $"Подготовлено {suggestions.Count} заданий."
                    : payload.StrategySummary.Trim();
                return new TaskSuggestionsResponse(suggestions, summary, tips);
            }
        }

        _logger.LogInformation("Falling back to rule-based task orchestrator.");
        return await _fallback.GenerateTaskSuggestionsAsync(request, cancellationToken);
    }

    public async Task<RewardSuggestionsResponse> GenerateRewardSuggestionsAsync(RewardSuggestionsRequest request, CancellationToken cancellationToken)
    {
        var payload = await RequestPayloadAsync<RewardSuggestionsPayload>(BuildRewardMessages(request), cancellationToken);
        if (payload?.Suggestions is { Count: > 0 })
        {
            var suggestions = payload.Suggestions
                .Select(item => item.ToModel())
                .Where(static reward => reward is not null)
                .Cast<RewardSuggestion>()
                .ToList();

            if (suggestions.Count > 0)
            {
                var summary = string.IsNullOrWhiteSpace(payload.BudgetSummary)
                    ? $"Подобрано {suggestions.Count} наград."
                    : payload.BudgetSummary.Trim();
                return new RewardSuggestionsResponse(suggestions, summary);
            }
        }

        _logger.LogInformation("Falling back to rule-based reward orchestrator.");
        return await _fallback.GenerateRewardSuggestionsAsync(request, cancellationToken);
    }

    public async Task<AiChatResponse> ProcessChatAsync(AiChatRequest request, CancellationToken cancellationToken)
    {
        var payload = await RequestPayloadAsync<ChatPayload>(BuildChatMessages(request), cancellationToken);
        if (payload is { Reply: { Length: > 0 } reply })
        {
            var followUps = payload.FollowUps?.Where(static tip => !string.IsNullOrWhiteSpace(tip)).ToArray() ??
                            new[] { "Нужно ли уточнить длительность задания?", "Хочешь идеи по наградам?" };
            var conversationId = string.IsNullOrWhiteSpace(request.ConversationId)
                ? Guid.NewGuid().ToString("N")
                : request.ConversationId;

            return new AiChatResponse(conversationId, reply.Trim(), followUps, _timeProvider.GetUtcNow());
        }

        _logger.LogInformation("Falling back to rule-based chat orchestrator.");
        return await _fallback.ProcessChatAsync(request, cancellationToken);
    }

    public async Task<AiAnalyticsResponse> BuildAnalyticsAsync(AiAnalyticsRequest request, CancellationToken cancellationToken)
    {
        var payload = await RequestPayloadAsync<AnalyticsPayload>(BuildAnalyticsMessages(request), cancellationToken);
        if (payload?.Insights is { Count: > 0 })
        {
            var insights = payload.Insights
                .Select(item => item.ToModel())
                .Where(static insight => insight is not null)
                .Cast<AiInsightCard>()
                .ToList();

            if (insights.Count > 0)
            {
                var summary = payload.Summary?.Count > 0
                    ? payload.Summary
                    : new Dictionary<string, string>
                    {
                        ["window"] = $"Последние {request.ResolveWindow()} дн.",
                        ["focus"] = "Фокус обновлён ИИ",
                        ["recommendation"] = "Добавьте семейный ритуал обратной связи."
                    };

                return new AiAnalyticsResponse(insights, summary);
            }
        }

        _logger.LogInformation("Falling back to rule-based analytics orchestrator.");
        return await _fallback.BuildAnalyticsAsync(request, cancellationToken);
    }

    private async Task<T?> RequestPayloadAsync<T>(IReadOnlyList<OpenAiMessage> messages, CancellationToken cancellationToken)
    {
        var raw = await SafeCallAsync(messages, cancellationToken);
        if (TryDeserialize(raw, out T? payload))
        {
            return payload;
        }

        return default;
    }

    private async Task<string> SafeCallAsync(IReadOnlyList<OpenAiMessage> messages, CancellationToken cancellationToken)
    {
        try
        {
            return await _client.GetCompletionAsync(messages, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "OpenAI request failed. Using fallback responses.");
            return string.Empty;
        }
    }

    private static IReadOnlyList<OpenAiMessage> BuildTaskMessages(TaskSuggestionsRequest request)
    {
        var limit = request.ResolveLimit();
        var payload = new StringBuilder();
        payload.AppendLine($"Сформируй до {limit} новых заданий для ребёнка.");
        payload.AppendLine($"Возраст: {request.ChildAge?.ToString() ?? "не указан"} лет.");
        payload.AppendLine($"Ключевые цели: {FormatList(request.Goals)}.");
        payload.AppendLine($"Интересы: {FormatList(request.Interests)}.");
        payload.AppendLine($"Недавние задания: {FormatList(request.RecentTasks)}.");
        payload.AppendLine($"Предпочтительный тон: {request.Tone ?? "дружелюбный"}.");
        payload.AppendLine($"Язык ответа: {request.Language ?? "ru-RU"}.");
        payload.AppendLine();
        payload.AppendLine("Верни строго JSON без комментариев в формате:\n{\"suggestions\": [{\"title\": string, \"description\": string, \"difficulty\": number 1-5, \"rewardXp\": number, \"rewardPoints\": number, \"tags\": [string], \"category\": string, \"impactSummary\": string}], \"strategySummary\": string, \"tips\": [string]}");

        return new[]
        {
            OpenAiMessage.System("Ты семейный ассистент для российских родителей. Отвечай лаконично, только JSON, без маркдауна."),
            OpenAiMessage.User(payload.ToString())
        };
    }

    private static IReadOnlyList<OpenAiMessage> BuildRewardMessages(RewardSuggestionsRequest request)
    {
        var limit = request.ResolveLimit();
        var builder = new StringBuilder();
        builder.AppendLine($"Предложи до {limit} наград.");
        builder.AppendLine($"Доступные очки: {request.AvailablePoints?.ToString() ?? "~400"}.");
        builder.AppendLine($"Интересы: {FormatList(request.Interests)}.");
        builder.AppendLine($"Недавние награды: {FormatList(request.RecentlyPurchasedRewards)}.");
        builder.AppendLine($"Повод: {request.Occasion ?? "обычный день"}.");
        builder.AppendLine();
        builder.AppendLine("Верни JSON вида:\n{\"suggestions\": [{\"title\": string, \"description\": string, \"cost\": number, \"category\": string, \"icon\": string, \"motivationHint\": string}], \"budgetSummary\": string}");

        return new[]
        {
            OpenAiMessage.System("Ты придумываешь поощрения для детей. Строго JSON, без поясняющего текста."),
            OpenAiMessage.User(builder.ToString())
        };
    }

    private static IReadOnlyList<OpenAiMessage> BuildChatMessages(AiChatRequest request)
    {
        var messages = new List<OpenAiMessage>
        {
            OpenAiMessage.System("Ты семейный ментор. Отвечай на русском, дружелюбно, JSON формата {\"reply\": string, \"followUps\": [string]}.")
        };

        foreach (var turn in request.History)
        {
            var role = string.Equals(turn.Role, "assistant", StringComparison.OrdinalIgnoreCase)
                ? "assistant"
                : "user";
            messages.Add(new OpenAiMessage(role, turn.Content));
        }

        var contextLines = request.Context.Count == 0
            ? "Контекст отсутствует."
            : string.Join(Environment.NewLine, request.Context.Select(pair => $"{pair.Key}: {pair.Value}"));

        var prompt = new StringBuilder();
        prompt.AppendLine("Новый вопрос:");
        prompt.AppendLine(request.Message);
        prompt.AppendLine();
        prompt.AppendLine("Контекст:");
        prompt.AppendLine(contextLines);
        prompt.AppendLine();
        prompt.AppendLine("Ответь JSON без markdown.");

        messages.Add(OpenAiMessage.User(prompt.ToString()));
        return messages;
    }

    private static IReadOnlyList<OpenAiMessage> BuildAnalyticsMessages(AiAnalyticsRequest request)
    {
        var builder = new StringBuilder();
        builder.AppendLine($"Проанализируй семью {request.FamilyId ?? "unknown"} с окном {request.ResolveWindow()} дней.");
        builder.AppendLine("Верни JSON формата {\"insights\": [{\"type\": string, \"title\": string, \"message\": string, \"severity\": string, \"tags\": [string]}], \"summary\": { string: string }}");
        builder.AppendLine($"Нужно до {request.ResolveLimit()} инсайтов.");

        return new[]
        {
            OpenAiMessage.System("Ты аналитик привычек. Отвечай только JSON."),
            OpenAiMessage.User(builder.ToString())
        };
    }

    private bool TryDeserialize<T>(string raw, out T? payload)
    {
        payload = default;
        if (string.IsNullOrWhiteSpace(raw))
        {
            return false;
        }

        var candidate = ExtractJson(raw);
        try
        {
            payload = JsonSerializer.Deserialize<T>(candidate, SerializerOptions);
            return payload is not null;
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Failed to parse OpenAI payload: {Payload}", raw);
            return false;
        }
    }

    private static string ExtractJson(string raw)
    {
        var start = raw.IndexOf('{');
        var end = raw.LastIndexOf('}');
        if (start >= 0 && end > start)
        {
            return raw[start..(end + 1)];
        }

        return raw;
    }

    private static string FormatList(IReadOnlyCollection<string> values)
        => values.Count == 0 ? "нет" : string.Join(", ", values);

    private sealed record TaskSuggestionsPayload(
        IReadOnlyCollection<TaskSuggestionPayload>? Suggestions,
        string? StrategySummary,
        IReadOnlyCollection<string>? Tips);

    private sealed record TaskSuggestionPayload(
        string? Title,
        string? Description,
        int? Difficulty,
        int? RewardXp,
        int? RewardPoints,
        IReadOnlyCollection<string>? Tags,
        string? Category,
        string? ImpactSummary)
    {
        public TaskSuggestion? ToModel()
        {
            if (string.IsNullOrWhiteSpace(Title) || string.IsNullOrWhiteSpace(Description))
            {
                return null;
            }

            var tags = Tags?.Where(static tag => !string.IsNullOrWhiteSpace(tag)).Select(static tag => tag.Trim()).ToArray()
                       ?? Array.Empty<string>();

            return new TaskSuggestion(
                Title.Trim(),
                Description.Trim(),
                Math.Clamp(Difficulty ?? 2, 1, 5),
                Math.Clamp(RewardXp ?? 80, 10, 300),
                Math.Clamp(RewardPoints ?? 20, 5, 400),
                tags,
                string.IsNullOrWhiteSpace(Category) ? "general" : Category.Trim(),
                string.IsNullOrWhiteSpace(ImpactSummary) ? "Уточните вместе с ребёнком выгоду." : ImpactSummary.Trim());
        }
    }

    private sealed record RewardSuggestionsPayload(
        IReadOnlyCollection<RewardSuggestionPayload>? Suggestions,
        string? BudgetSummary);

    private sealed record RewardSuggestionPayload(
        string? Title,
        string? Description,
        int? Cost,
        string? Category,
        string? Icon,
        string? MotivationHint)
    {
        public RewardSuggestion? ToModel()
        {
            if (string.IsNullOrWhiteSpace(Title) || string.IsNullOrWhiteSpace(Description))
            {
                return null;
            }

            return new RewardSuggestion(
                Title.Trim(),
                Description.Trim(),
                Math.Clamp(Cost ?? 250, 50, 800),
                string.IsNullOrWhiteSpace(Category) ? "general" : Category.Trim(),
                string.IsNullOrWhiteSpace(Icon) ? "🎯" : Icon.Trim(),
                string.IsNullOrWhiteSpace(MotivationHint) ? "Отметьте прогресс" : MotivationHint.Trim());
        }
    }

    private sealed record ChatPayload(string? Reply, IReadOnlyCollection<string>? FollowUps);

    private sealed record AnalyticsPayload(
        IReadOnlyCollection<InsightPayload>? Insights,
        IReadOnlyDictionary<string, string>? Summary);

    private sealed record InsightPayload(
        string? Type,
        string? Title,
        string? Message,
        string? Severity,
        IReadOnlyCollection<string>? Tags)
    {
        public AiInsightCard? ToModel()
        {
            if (string.IsNullOrWhiteSpace(Type) || string.IsNullOrWhiteSpace(Title) || string.IsNullOrWhiteSpace(Message))
            {
                return null;
            }

            var tags = Tags?.Where(static tag => !string.IsNullOrWhiteSpace(tag)).Select(static tag => tag.Trim()).ToArray()
                       ?? Array.Empty<string>();

            return new AiInsightCard(
                Type.Trim(),
                Title.Trim(),
                Message.Trim(),
                string.IsNullOrWhiteSpace(Severity) ? "info" : Severity.Trim(),
                tags);
        }
    }
}
