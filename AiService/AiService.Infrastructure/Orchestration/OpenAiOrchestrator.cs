using System.Text;
using System.Text.Json;
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
    private readonly ILogger<OpenAiOrchestrator> _logger;
    private readonly TimeProvider _timeProvider;

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

    public async Task<TaskSuggestionsResponse> GenerateTaskSuggestionsAsync(TaskSuggestionsRequest request,
        CancellationToken cancellationToken)
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
                var tips = payload.Tips?.Where(static tip => !string.IsNullOrWhiteSpace(tip)).ToArray() ??
                           Array.Empty<string>();
                var summary = string.IsNullOrWhiteSpace(payload.StrategySummary)
                    ? $"Prepared {suggestions.Count} tasks."
                    : payload.StrategySummary.Trim();
                return new TaskSuggestionsResponse(suggestions, summary, tips);
            }
        }

        _logger.LogInformation("Falling back to rule-based task orchestrator.");
        return await _fallback.GenerateTaskSuggestionsAsync(request, cancellationToken);
    }

    public async Task<RewardSuggestionsResponse> GenerateRewardSuggestionsAsync(RewardSuggestionsRequest request,
        CancellationToken cancellationToken)
    {
        var payload =
            await RequestPayloadAsync<RewardSuggestionsPayload>(BuildRewardMessages(request), cancellationToken);
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
                    ? $"Selected {suggestions.Count} rewards."
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
                            Array.Empty<string>();
            var conversationId = string.IsNullOrWhiteSpace(request.ConversationId)
                ? Guid.NewGuid().ToString("N")
                : request.ConversationId;

            var actions = ParseActions(payload.Actions);
            return new AiChatResponse(conversationId, reply.Trim(), followUps, actions, _timeProvider.GetUtcNow());
        }

        _logger.LogInformation("Falling back to rule-based chat orchestrator.");
        return await _fallback.ProcessChatAsync(request, cancellationToken);
    }

    public async Task<AiAnalyticsResponse> BuildAnalyticsAsync(AiAnalyticsRequest request,
        CancellationToken cancellationToken)
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
                        ["window"] = $"Last {request.ResolveWindow()} days",
                        ["focus"] = "Focus updated by AI",
                        ["recommendation"] = "Add a family feedback ritual."
                    };

                return new AiAnalyticsResponse(insights, summary);
            }
        }

        _logger.LogInformation("Falling back to rule-based analytics orchestrator.");
        return await _fallback.BuildAnalyticsAsync(request, cancellationToken);
    }

    private async Task<T?> RequestPayloadAsync<T>(IReadOnlyList<OpenAiMessage> messages,
        CancellationToken cancellationToken)
    {
        var raw = await SafeCallAsync(messages, cancellationToken);
        if (TryDeserialize(raw, out T? payload)) return payload;

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
        var lang = request.Language ?? "ru-RU";
        var isRussian = lang.StartsWith("ru", StringComparison.OrdinalIgnoreCase);

        var payload = new StringBuilder();
        if (isRussian)
        {
            payload.AppendLine($"Сформируй до {limit} новых заданий для ребёнка.");
            payload.AppendLine($"Количество предложений: {limit}.");
            payload.AppendLine($"Возраст: {request.ChildAge?.ToString() ?? "не указан"} лет.");
            payload.AppendLine($"Предпочтительный тон: {request.Tone ?? "дружелюбный"}.");
        }
        else
        {
            payload.AppendLine($"Generate up to {limit} new tasks for a child.");
            payload.AppendLine($"Number of suggestions: {limit}.");
            payload.AppendLine($"Age: {request.ChildAge?.ToString() ?? "not specified"} years.");
            payload.AppendLine($"Preferred tone: {request.Tone ?? "friendly"}.");
        }

        payload.AppendLine($"Response language: {lang}.");

        if (!string.IsNullOrWhiteSpace(request.TaskDescription))
        {
            payload.AppendLine();
            payload.AppendLine(isRussian
                ? "Описание задачи (основной контекст для генерации):"
                : "Task description (main context for generation):");
            payload.AppendLine(request.TaskDescription!.Trim());
            payload.AppendLine();
            if (limit == 1)
                payload.AppendLine(isRussian
                    ? "Если указано описание задачи — верни ровно 1 задачу, строго основанную на нём."
                    : "If a task description is provided — return exactly 1 task, strictly based on it.");
            else
                payload.AppendLine(isRussian
                    ? $"Если указано описание задачи — верни ровно {limit} задач, строго основанных на нём."
                    : $"If a task description is provided — return exactly {limit} tasks, strictly based on it.");
            payload.AppendLine();
            payload.AppendLine(isRussian
                ? "ВАЖНО: Не добавляй подробности, которых нет в описании. Если пользователь написал 'убрать на кухне' — не добавляй 'разложить игрушки' или другие действия. Описание должно быть простым и соответствовать тому что написал пользователь. Задача должна быть посильной для ребёнка."
                : "IMPORTANT: Do NOT invent details that are not in the description. If the user wrote 'clean the kitchen' — do not add 'organize toys' or other unrelated actions. Keep the description simple and true to what the user wrote. The task must be age-appropriate and manageable for a child.");
        }

        payload.AppendLine();
        payload.AppendLine(
            "Return JSON:\n{\"suggestions\": [{\"title\": string, \"description\": string, \"difficulty\": number, \"tags\": [string], \"category\": string, \"impactSummary\": string}], \"strategySummary\": string, \"tips\": [string]}"
        );

        var systemMsg = isRussian
            ? "Ты семейный ассистент для родителей. Отвечай лаконично, только JSON, без маркдауна."
            : "You are a family assistant for parents. Reply concisely, JSON only, no markdown.";

        return
        [
            OpenAiMessage.System(systemMsg),
            OpenAiMessage.User(payload.ToString())
        ];
    }

    private static IReadOnlyList<OpenAiMessage> BuildRewardMessages(RewardSuggestionsRequest request)
    {
        var limit = request.ResolveLimit();
        var lang = request.Language ?? "ru-RU";
        var isRussian = lang.StartsWith("ru", StringComparison.OrdinalIgnoreCase);

        var builder = new StringBuilder();
        if (isRussian)
        {
            builder.AppendLine($"Предложи до {limit} наград.");
            builder.AppendLine($"Доступные очки: {request.AvailablePoints?.ToString() ?? "~400"}.");
            builder.AppendLine($"Интересы: {FormatList(request.Interests, isRussian)}.");
            builder.AppendLine($"Недавние награды: {FormatList(request.RecentlyPurchasedRewards, isRussian)}.");
            builder.AppendLine($"Повод: {request.Occasion ?? "обычный день"}.");
        }
        else
        {
            builder.AppendLine($"Suggest up to {limit} rewards.");
            builder.AppendLine($"Available points: {request.AvailablePoints?.ToString() ?? "~400"}.");
            builder.AppendLine($"Interests: {FormatList(request.Interests, isRussian)}.");
            builder.AppendLine($"Recent rewards: {FormatList(request.RecentlyPurchasedRewards, isRussian)}.");
            builder.AppendLine($"Occasion: {request.Occasion ?? "regular day"}.");
        }

        builder.AppendLine();
        builder.AppendLine(
            "Return JSON:\n{\"suggestions\": [{\"title\": string, \"description\": string, \"cost\": number, \"category\": string, \"icon\": string, \"motivationHint\": string}], \"budgetSummary\": string}");

        var systemMsg = isRussian
            ? "Ты придумываешь поощрения для детей. Строго JSON, без поясняющего текста."
            : "You create rewards for children. Strictly JSON, no explanatory text.";

        return new[]
        {
            OpenAiMessage.System(systemMsg),
            OpenAiMessage.User(builder.ToString())
        };
    }
    
    private static IReadOnlyList<OpenAiMessage> BuildChatMessages(AiChatRequest request)
    {
        // Determine the user's preferred language from context
        var locale = request.Context.TryGetValue("locale", out var loc) ? loc : null;
        var audience = request.Context.TryGetValue("audience", out var aud) ? aud : "parent";
        var isChild = string.Equals(audience, "child", StringComparison.OrdinalIgnoreCase);

        var langInstruction = !string.IsNullOrWhiteSpace(locale)
            ? $"The user's interface language is {locale}. You MUST reply in this language. If the user writes in a different language, still prefer {locale} unless they explicitly ask you to switch."
            : "You MUST detect the language of the user's message and ALWAYS reply in the SAME language.";

        var childRestriction = isChild
            ? "\nIMPORTANT: The current user is a CHILD. You must NEVER include actions of type CreateTask, CreateTasks, CreateReward, CreateRewards, or CompleteTask for children. Children cannot create or manage tasks/rewards. Only help them understand tasks, give tips, motivate, and answer questions. You can suggest they ask their parent if they need something changed."
            : "\nIMPORTANT: When the user asks to create a task, reward, send a message, or perform an action — you MUST include the corresponding actions in the response. Do not just describe what to do — provide ready-to-execute data.";

        var systemPrompt = "You are a family mentor assistant. " + langInstruction + "\n" +
            "Be friendly and supportive." + childRestriction + "\n\n" +
            "Available action types:\n" +
            "- CreateTask: create one task. Payload: {title, description, difficulty (1-5), category, tags[]}\n" +
            "- CreateTasks: create multiple tasks. Payload: {tasks: [{title, description, difficulty, category, tags[]}]}\n" +
            "- CreateReward: create a reward. Payload: {title, description, cost, category, icon}\n" +
            "- CreateRewards: create multiple rewards. Payload: {rewards: [{title, description, cost, category, icon}]}\n" +
            "- CompleteTask: mark a task as completed. Payload: {taskId}\n" +
            "- Navigate: navigate to a page. Payload: {route, queryParams}\n\n" +
            "Keywords that indicate task creation (any language): \"task\", \"задач\", \"создай\", \"добав\", \"create\", \"add\", \"make\"\n" +
            "Keywords that indicate reward creation: \"reward\", \"наград\", \"приз\", \"поощрен\", \"prize\", \"bonus\"\n" +
            "Keywords that indicate task completion: \"complete\", \"done\", \"выполн\", \"готов\", \"finish\"\n\n" +
            "Response format (strictly JSON):\n" +
            "{\"reply\": \"Text response to user\", \"followUps\": [\"suggestion1\"], \"actions\": [{\"type\": \"CreateTask\", \"label\": \"label\", \"description\": \"desc\", \"variant\": \"primary\", \"priority\": 1, \"payload\": {}}]}\n\n" +
            "If no actions are needed, return an empty actions array: [].\n" +
            "Reply ONLY with valid JSON without markdown code blocks.";

        var messages = new List<OpenAiMessage>
        {
            OpenAiMessage.System(systemPrompt)
        };

        foreach (var turn in request.History)
        {
            var role = string.Equals(turn.Role, "assistant", StringComparison.OrdinalIgnoreCase)
                ? "assistant"
                : "user";
            messages.Add(new OpenAiMessage(role, turn.Content));
        }

        var contextLines = request.Context.Count == 0
            ? string.Empty
            : string.Join(Environment.NewLine, request.Context.Select(pair => $"{pair.Key}: {pair.Value}"));

        var prompt = new StringBuilder();
        prompt.AppendLine("User request:");
        prompt.AppendLine(request.Message);
        if (contextLines.Length > 0)
        {
            prompt.AppendLine();
            prompt.AppendLine("Context:");
            prompt.AppendLine(contextLines);
        }
        prompt.AppendLine();
        prompt.AppendLine("Reply with JSON. If an action is needed — always include actions. Reply in the same language as the user's message.");

        messages.Add(OpenAiMessage.User(prompt.ToString()));
        return messages;
    }

    private static IReadOnlyList<OpenAiMessage> BuildAnalyticsMessages(AiAnalyticsRequest request)
    {
        var lang = request.Language ?? "ru-RU";
        var isRussian = lang.StartsWith("ru", StringComparison.OrdinalIgnoreCase);

        var builder = new StringBuilder();
        if (isRussian)
        {
            builder.AppendLine(
                $"Проанализируй семью {request.FamilyId ?? "unknown"} с окном {request.ResolveWindow()} дней.");
            builder.AppendLine(
                "Верни JSON формата {\"insights\": [{\"type\": string, \"title\": string, \"message\": string, \"severity\": string, \"tags\": [string]}], \"summary\": { string: string }}");
            builder.AppendLine($"Нужно до {request.ResolveLimit()} инсайтов.");
        }
        else
        {
            builder.AppendLine(
                $"Analyze family {request.FamilyId ?? "unknown"} with a window of {request.ResolveWindow()} days.");
            builder.AppendLine(
                "Return JSON: {\"insights\": [{\"type\": string, \"title\": string, \"message\": string, \"severity\": string, \"tags\": [string]}], \"summary\": { string: string }}");
            builder.AppendLine($"Provide up to {request.ResolveLimit()} insights.");
        }

        var systemMsg = isRussian
            ? "Ты аналитик привычек. Отвечай только JSON."
            : "You are a habit analyst. Reply only with JSON.";

        return new[]
        {
            OpenAiMessage.System(systemMsg),
            OpenAiMessage.User(builder.ToString())
        };
    }

    private bool TryDeserialize<T>(string raw, out T? payload)
    {
        payload = default;
        if (string.IsNullOrWhiteSpace(raw)) return false;

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
        if (start >= 0 && end > start) return raw[start..(end + 1)];

        return raw;
    }

    private static string FormatList(IReadOnlyCollection<string> values, bool isRussian = true)
    {
        return values.Count == 0 ? (isRussian ? "нет" : "none") : string.Join(", ", values);
    }

    private sealed record TaskSuggestionsPayload(
        IReadOnlyCollection<TaskSuggestionPayload>? Suggestions,
        string? StrategySummary,
        IReadOnlyCollection<string>? Tips);

    private sealed record TaskSuggestionPayload(
        string? Title,
        string? Description,
        int? Difficulty,
        IReadOnlyCollection<string>? Tags,
        string? Category,
        string? ImpactSummary)
    {
        public TaskSuggestion? ToModel()
        {
            if (string.IsNullOrWhiteSpace(Title) || string.IsNullOrWhiteSpace(Description)) return null;

            var tags = Tags?.Where(static tag => !string.IsNullOrWhiteSpace(tag)).Select(static tag => tag.Trim())
                           .ToArray()
                       ?? Array.Empty<string>();

            return new TaskSuggestion(
                Title.Trim(),
                Description.Trim(),
                Math.Clamp(Difficulty ?? 2, 1, 5),
                tags,
                string.IsNullOrWhiteSpace(Category) ? "general" : Category.Trim(),
                string.IsNullOrWhiteSpace(ImpactSummary) ? "Уточните вместе с ребёнком выгоду." : ImpactSummary.Trim());
        }
    }

    private sealed record RewardSuggestionsPayload(
        IReadOnlyCollection<RewardSuggestionPayload>? Suggestions,
        string? BudgetSummary);

    private sealed record TaskDescriptionPayload(
        string Description
    );

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
            if (string.IsNullOrWhiteSpace(Title) || string.IsNullOrWhiteSpace(Description)) return null;

            return new RewardSuggestion(
                Title.Trim(),
                Description.Trim(),
                Math.Clamp(Cost ?? 250, 50, 800),
                string.IsNullOrWhiteSpace(Category) ? "general" : Category.Trim(),
                string.IsNullOrWhiteSpace(Icon) ? "🎯" : Icon.Trim(),
                string.IsNullOrWhiteSpace(MotivationHint) ? "Отметьте прогресс" : MotivationHint.Trim());
        }
    }

    private sealed record ChatPayload(
        string? Reply,
        IReadOnlyCollection<string>? FollowUps,
        IReadOnlyCollection<ActionPayload>? Actions);

    private sealed record ActionPayload(
        string? Type,
        string? Label,
        string? Description,
        string? Variant,
        int? Priority,
        JsonElement? Payload);

    private IReadOnlyCollection<AiAction> ParseActions(IReadOnlyCollection<ActionPayload>? actions)
    {
        if (actions is null || actions.Count == 0)
            return Array.Empty<AiAction>();

        var result = new List<AiAction>();
        foreach (var action in actions)
        {
            if (string.IsNullOrWhiteSpace(action.Type) || string.IsNullOrWhiteSpace(action.Label))
                continue;

            if (!Enum.TryParse<AiActionType>(action.Type, ignoreCase: true, out var actionType))
            {
                _logger.LogWarning("Unknown action type: {Type}", action.Type);
                continue;
            }

            object? payload = null;
            if (action.Payload.HasValue && action.Payload.Value.ValueKind != JsonValueKind.Undefined)
            {
                try
                {
                    payload = actionType switch
                    {
                        AiActionType.CreateTask => action.Payload.Value.Deserialize<CreateTaskPayload>(
                            SerializerOptions),
                        AiActionType.CreateTasks => action.Payload.Value.Deserialize<CreateTasksPayload>(
                            SerializerOptions),
                        AiActionType.CreateReward => action.Payload.Value.Deserialize<CreateRewardPayload>(
                            SerializerOptions),
                        AiActionType.CreateRewards => action.Payload.Value.Deserialize<CreateRewardsPayload>(
                            SerializerOptions),
                        AiActionType.Navigate => action.Payload.Value.Deserialize<NavigatePayload>(SerializerOptions),
                        AiActionType.SendFamilyMessage => action.Payload.Value.Deserialize<SendFamilyMessagePayload>(
                            SerializerOptions),
                        _ => action.Payload.Value.Deserialize<object>(SerializerOptions)
                    };
                }
                catch (JsonException ex)
                {
                    _logger.LogWarning(ex, "Failed to deserialize action payload for type {Type}", action.Type);
                    payload = null;
                }
            }

            result.Add(new AiAction
            {
                Type = actionType,
                Label = action.Label.Trim(),
                Description = action.Description?.Trim(),
                Variant = string.IsNullOrWhiteSpace(action.Variant) ? "primary" : action.Variant.Trim(),
                Priority = action.Priority ?? 0,
                Payload = payload
            });
        }

        return result.OrderBy(a => a.Priority).ToList();
    }

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
            if (string.IsNullOrWhiteSpace(Type) || string.IsNullOrWhiteSpace(Title) ||
                string.IsNullOrWhiteSpace(Message))
                return null;

            var tags = Tags?.Where(static tag => !string.IsNullOrWhiteSpace(tag)).Select(static tag => tag.Trim())
                           .ToArray()
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