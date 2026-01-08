using System.Security.Cryptography;
using System.Text;
using AiService.Application.Abstractions;
using AiService.Application.Contracts;

namespace AiService.Infrastructure.Orchestration;

public sealed class RuleBasedAiOrchestrator(TimeProvider timeProvider) : IAiOrchestrator
{
    private static readonly TaskTemplate[] TaskTemplates =
    [
        new("Организуй рабочее место", "Разложи книги и тетради, протри стол, подготовь материалы на завтра.", "focus",
            ["учёба", "чистота"], 2, 80, 15, "Формирует привычку готовиться заранее."),
        new("Творческая пауза", "Создай мини-комикс о приключении семьи за 20 минут.", "creativity",
            ["рисование", "творчество"], 3, 110, 25, "Развивает воображение и речь."),
        new("Научный эксперимент", "Проведи маленький эксперимент: измерь, как быстро тает лёд в разных местах.",
            "science", ["наука", "эксперимент"], 3, 130, 30, "Поддерживает интерес к исследованиям."),
        new("Спортивный вызов", "Сделай 3 подхода упражнений на выбор: планка, приседания или прыжки.", "health",
            ["спорт", "здоровье"], 2, 90, 18, "Помогает выплеснуть энергию."),
        new("Миссия заботы", "Покорми питомца, обнови воду и добавь заметку о настроении.", "responsibility",
            ["дом", "уход"], 1, 60, 12, "Учит наблюдать и заботиться."),
        new("Математический блиц", "Реши 6 примеров на устный счёт или повтори таблицу умножения.", "learning",
            ["математика", "учёба"], 2, 95, 20, "Поддерживает уверенность в счёте."),
        new("Семейный репортёр", "Возьми интервью у родственника: " +
                                 "задай 3 вопроса о его дне и запиши ответы.", "communication", ["общение", "семья"], 2,
            85, 16, "Прокачивает эмпатию и слушание."),
        new("Квест по дому", "Найди 5 предметов, которые лежат не на своих местах, и убери их.", "home",
            ["дом", "организация"], 1, 70, 14, "Быстрый способ вернуть порядок."),
        new("Мини-проект", "Составь список целей на неделю и укрась его наклейками.", "planning",
            ["планирование", "организация"], 3, 120, 28, "Создаёт ощущение контроля."),
        new("Дневник успеха", "Запиши 3 достижения за день и придумай награду за них.", "reflection",
            ["осознанность", "мотивация"], 1, 60, 10, "Формирует позитивный взгляд.")
    ];

    private static readonly RewardTemplate[] RewardTemplates =
    [
        new("Пикник в гостиной", "Импровизированный пикник с пледом и любимым десертом.", 320, "family", "🍓",
            "Подходит для выходного вечера."),
        new("Дополнительное время на творчество", "30 минут для творчества или конструктора.", 250, "creativity", "🎨",
            "Даёт пространство для самовыражения."),
        new("Совместная игра", "Родитель выбирает настольную игру вместе с ребёнком.", 280, "connection", "🎲",
            "Укрепляет семейную связь."),
        new("Приватный плейлист", "Ребёнок выбирает музыку на дорогу или обед.", 180, "music", "🎧",
            "Маленькая, но приятная привилегия."),
        new("Билет на мини-кино", "Выбор мультфильма с попкорном.", 420, "relax", "🎬", "Создаёт атмосферу праздника."),
        new("Карта добрых дел", "Сертификат на помощь от родителя: уборка, готовка или проект.", 350, "support", "🤝",
            "Показывает взаимную заботу."),
        new("Ночной фонарик", "Чтение сказки или фонарик для палатки под столом.", 200, "imagination", "🔦",
            "Подходит для младших детей."),
        new("Мини-шопинг", "Онлайн-выбор наклеек или аксессуара в условном бюджете.", 500, "shopping", "🛍️",
            "Учит управлять ресурсами.")
    ];

    public Task<TaskSuggestionsResponse> GenerateTaskSuggestionsAsync(TaskSuggestionsRequest request,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (request is null) throw new ArgumentNullException(nameof(request));

        var limit = request.ResolveLimit();
        var ordered = TaskTemplates
            .Select(template => new
            {
                Template = template,
                Score = ScoreTemplate(template.Tags, request.Interests, request.Goals, request.RecentTasks)
            })
            .OrderByDescending(x => x.Score)
            .ThenBy(_ => RandomNumberGenerator.GetInt32(0, 100))
            .Take(limit)
            .Select(x => x.Template.ToSuggestion(request))
            .ToList();

        if (ordered.Count == 0) return Task.FromResult(TaskSuggestionsResponse.Empty());

        var summary = BuildTaskStrategySummary(request, ordered.Count);
        var tips = BuildTips(request);
        return Task.FromResult(new TaskSuggestionsResponse(ordered, summary, tips));
    }

    //TODO Implement this service
    public Task<TaskDescriptionResponse> GenerateTaskDescriptionAsync(TaskDescriptionRequest request, CancellationToken cancellationToken)
    {
        throw new NotImplementedException();
    }

    public Task<RewardSuggestionsResponse> GenerateRewardSuggestionsAsync(RewardSuggestionsRequest request,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (request is null) throw new ArgumentNullException(nameof(request));

        var available = request.AvailablePoints ?? 400;
        var limit = request.ResolveLimit();
        var suggestions = RewardTemplates
            .Select(template => new
            {
                Template = template,
                Score = ScoreTemplate(template.Tags, request.Interests, request.RecentlyPurchasedRewards,
                            Array.Empty<string>()) +
                        (template.Cost <= available ? 1.5 : 0)
            })
            .OrderByDescending(x => x.Score)
            .ThenBy(_ => RandomNumberGenerator.GetInt32(0, 100))
            .Take(limit)
            .Select(x => x.Template.ToSuggestion(available))
            .ToList();

        var budgetSummary = BuildBudgetSummary(available, suggestions.Count, request.Occasion);
        return Task.FromResult(new RewardSuggestionsResponse(suggestions, budgetSummary));
    }

    public Task<AiChatResponse> ProcessChatAsync(AiChatRequest request, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (request is null) throw new ArgumentNullException(nameof(request));
        if (string.IsNullOrWhiteSpace(request.Message))
            throw new ArgumentException("Сообщение не может быть пустым.", nameof(request));

        var conversationId = string.IsNullOrWhiteSpace(request.ConversationId)
            ? Guid.NewGuid().ToString("N")
            : request.ConversationId;

        var contextHint = ResolveContextHint(request.Context);
        var reply = new StringBuilder();
        reply.AppendLine(contextHint);
        reply.AppendLine();
        reply.AppendLine($"Вот что можно сделать: {BuildAnswerCore(request.Message)}");

        var followUps = BuildFollowUps(request.Message, request.Context);
        var actions = BuildActionsForMessage(request.Message);
        return Task.FromResult(new AiChatResponse(conversationId, reply.ToString().Trim(), followUps, actions,
            timeProvider.GetUtcNow()));
    }

    private static IReadOnlyCollection<AiAction> BuildActionsForMessage(string message)
    {
        var actions = new List<AiAction>();
        var lowerMsg = message.ToLowerInvariant();

        if (lowerMsg.Contains("задач") || lowerMsg.Contains("создай") || lowerMsg.Contains("добав"))
        {
            actions.Add(new AiAction
            {
                Type = AiActionType.CreateTask,
                Label = "Создать задачу",
                Description = "Создать новую задачу по вашему запросу",
                Variant = "primary",
                Priority = 1,
                Payload = new CreateTaskPayload
                {
                    Title = "Новая задача",
                    Description = "Описание задачи на основе вашего запроса",
                    Difficulty = 2,
                    RewardXp = 80,
                    RewardPoints = 20,
                    Category = "general"
                }
            });
        }

        if (lowerMsg.Contains("наград") || lowerMsg.Contains("приз") || lowerMsg.Contains("поощрен"))
        {
            actions.Add(new AiAction
            {
                Type = AiActionType.CreateReward,
                Label = "Создать награду",
                Description = "Добавить новую награду в магазин",
                Variant = "secondary",
                Priority = 2,
                Payload = new CreateRewardPayload
                {
                    Title = "Новая награда",
                    Description = "Награда за достижения",
                    Cost = 200,
                    Category = "general",
                    Icon = "🎁"
                }
            });
        }

        return actions;
    }

    public Task<AiAnalyticsResponse> BuildAnalyticsAsync(AiAnalyticsRequest request,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (request is null) throw new ArgumentNullException(nameof(request));
        if (string.IsNullOrWhiteSpace(request.UserId))
            throw new ArgumentException("UserId is required.", nameof(request));

        var window = request.ResolveWindow();
        var limit = request.ResolveLimit();
        var insights = GenerateInsights(window, limit).ToList();
        var summary = new Dictionary<string, string>
        {
            ["window"] = $"Последние {window} дн.",
            ["focus"] = insights.Any(i => i.Type == "progress") ? "Прогресс стабилен" : "Есть точки роста",
            ["recommendation"] = "Поддерживайте короткие циклы обратной связи и обновляйте награды раз в 2 недели."
        };

        return Task.FromResult(new AiAnalyticsResponse(insights, summary));
    }

    private static IReadOnlyCollection<string> BuildTips(TaskSuggestionsRequest request)
    {
        var tips = new List<string>();
        if (request.ChildAge is >= 6 and <= 10)
            tips.Add("Используйте визуальные трекеры прогресса — они хорошо работают для младших детей.");

        if (request.Interests.Count > 0)
            tips.Add("Связывайте задания с интересами ребёнка, чтобы не терялась внутренняя мотивация.");

        if (request.RecentTasks.Count > 0)
            tips.Add("Перед выдачей новой задачи отметьте, что уже получилось — это усиливает уверенность.");

        if (tips.Count == 0)
            tips.Add("Уточните настроение ребёнка перед началом — это помогает подобрать верный тон общения.");

        return tips;
    }

    private static string BuildTaskStrategySummary(TaskSuggestionsRequest request, int count)
    {
        var focus = request.Goals.FirstOrDefault() ?? request.Interests.FirstOrDefault() ?? "баланс развития";
        return $"Сформирован набор из {count} заданий, ориентированных на {focus}. Меняйте сложность каждые 2-3 дня.";
    }

    private static string BuildBudgetSummary(int availablePoints, int count, string? occasion)
    {
        var occasionPart = string.IsNullOrWhiteSpace(occasion)
            ? ""
            : $" к событию \"{occasion}\"";
        return $"Подобрано {count} наград{occasionPart}. Рекомендуемый резерв: {availablePoints} очков.";
    }

    private static string ResolveContextHint(IReadOnlyDictionary<string, string> context)
    {
        if (context.TryGetValue("childName", out var name) && !string.IsNullOrWhiteSpace(name))
            return $"{name}, давай разберёмся вместе!";

        if (context.TryGetValue("audience", out var audience))
            return audience switch
            {
                "parent" => "Собрала рекомендации для родителя:",
                "child" => "Привет! Вот что можно сделать:",
                _ => "Вот план действий:"
            };

        return "Вот план действий:";
    }

    private static string BuildAnswerCore(string message)
    {
        if (message.Contains("мотива", StringComparison.OrdinalIgnoreCase))
            return
                "разбейте цель на короткие шаги, добавьте мгновенную награду и проговорите, какая выгода будет завтра.";

        if (message.Contains("награ", StringComparison.OrdinalIgnoreCase))
            return
                "смешайте быстрые микро-награды (наклейки, выбор музыки) и долгосрочные призы, чтобы видеть прогресс ежедневно.";

        if (message.Contains("задач", StringComparison.OrdinalIgnoreCase))
            return
                "задачи лучше объединять в тематические блоки и закрывать один блок за вечер, чтобы видеть результат.";

        return
            "разбейте запрос на 3 шага: обсудите ожидания, договоритесь о правилах и закрепите итог коротким ритуалом.";
    }

    private static IReadOnlyCollection<string> BuildFollowUps(string message,
        IReadOnlyDictionary<string, string> context)
    {
        var followUps = new List<string>
        {
            "Нужно ли уточнить длительность или сложность задания?",
            "Хотите получить идеи по системе наград?"
        };

        if (context.ContainsKey("childName"))
            followUps.Add("Расскажи, что больше всего нравится ребёнку — так рекомендации будут точнее.");

        if (message.Contains("учёб", StringComparison.OrdinalIgnoreCase))
            followUps.Add("Нужен ли план подготовки к урокам на неделю?");

        return followUps;
    }

    private static IEnumerable<AiInsightCard> GenerateInsights(int windowDays, int limit)
    {
        var baseCards = new List<AiInsightCard>
        {
            new("warning", "Нужна пауза",
                "Ребёнок снижает активность к вечеру. Запланируйте лёгкие задания после 19:00.", "medium",
                ["routine", "energy"]),
            new("progress", "Сильная сторона", "Уровень вовлечения в учебные задания вырос на 18% за последние недели.",
                "success", ["learning", "focus"]),
            new("insight", "Экономика наград",
                "Средняя стоимость наград выросла. Добавьте больше бонусов до 200 очков.", "info",
                ["rewards", "budget"]),
            new("tip", "Командная цель",
                "Попробуйте семейную миссию на {windowDays} дней, чтобы закрепить новую привычку.", "info",
                ["family", "habits"])
        };

        return baseCards.Take(limit);
    }

    private static double ScoreTemplate(
        IReadOnlyCollection<string> templateTags,
        IReadOnlyCollection<string> primary,
        IReadOnlyCollection<string> secondary,
        IReadOnlyCollection<string> negativeMatches)
    {
        double score = 1;
        if (primary.Count == 0 && secondary.Count == 0) return score;

        score += CountMatches(templateTags, primary) * 2.0;
        score += CountMatches(templateTags, secondary);

        if (negativeMatches.Any(task =>
                templateTags.Any(tag => task.Contains(tag, StringComparison.OrdinalIgnoreCase)))) score -= 1.5;

        return score;
    }

    private static double CountMatches(IReadOnlyCollection<string> tags, IReadOnlyCollection<string> reference)
    {
        if (reference.Count == 0) return 0;
        return reference.Count(value => tags.Any(tag => tag.Contains(value, StringComparison.OrdinalIgnoreCase))) * 1.0;
    }

    private sealed record TaskTemplate(
        string Title,
        string Description,
        string Category,
        IReadOnlyCollection<string> Tags,
        int Difficulty,
        int RewardXp,
        int RewardPoints,
        string ImpactSummary)
    {
        public TaskSuggestion ToSuggestion(TaskSuggestionsRequest request)
        {
            var personalizedDescription = Description;
            if (!string.IsNullOrWhiteSpace(request.ChildId))
                personalizedDescription = Description + " Поделись результатом в общем чате семьи.";

            return new TaskSuggestion(
                Title,
                personalizedDescription,
                Difficulty,
                RewardXp,
                RewardPoints,
                Tags,
                Category,
                ImpactSummary);
        }
    }

    private sealed record RewardTemplate(
        string Title,
        string Description,
        int Cost,
        string Category,
        string Icon,
        string MotivationHint)
    {
        private IReadOnlyCollection<string>? _tags;
        public IReadOnlyCollection<string> Tags => TagsCache;

        private IReadOnlyCollection<string> TagsCache => _tags ??= Category.Split('-',
            StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        public RewardSuggestion ToSuggestion(int availablePoints)
        {
            var adjustedCost = Math.Min(Cost, Math.Max(availablePoints + 150, Cost));
            return new RewardSuggestion(Title, Description, adjustedCost, Category, Icon, MotivationHint);
        }
    }
}