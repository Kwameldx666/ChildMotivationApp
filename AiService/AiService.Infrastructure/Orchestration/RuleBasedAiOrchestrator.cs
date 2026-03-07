using System.Security.Cryptography;
using System.Text;
using AiService.Application.Abstractions;
using AiService.Application.Contracts;

namespace AiService.Infrastructure.Orchestration;

public sealed class RuleBasedAiOrchestrator(TimeProvider timeProvider) : IAiOrchestrator
{
    private static readonly TaskTemplate[] TaskTemplatesRu =
    [
        new("Организация рабочего места", "Разложи книги и тетради, протри стол, подготовь материалы на завтра.", "focus",
            ["учёба", "чистота"], 2, "Формирует привычку готовиться заранее."),
        new("Творческая пауза", "Создай мини-комикс о семейном приключении за 20 минут.", "creativity",
            ["рисование", "творчество"], 3, "Развивает воображение и речь."),
        new("Научный эксперимент", "Проведи маленький опыт: измерь, как быстро тает лёд в разных местах.",
            "science", ["наука", "эксперимент"], 3, "Поддерживает интерес к исследованиям."),
        new("Спортивный вызов", "Выполни 3 подхода упражнений на выбор: планка, приседания или прыжки.", "health",
            ["спорт", "здоровье"], 2, "Помогает выплеснуть энергию."),
        new("Миссия заботы", "Покорми питомца, обнови воду и добавь заметку о его настроении.", "responsibility",
            ["дом", "забота"], 1, "Учит наблюдательности и заботе."),
        new("Математический блиц", "Реши 6 примеров в уме или повтори таблицу умножения.", "learning",
            ["математика", "учёба"], 2, "Повышает уверенность в вычислениях."),
        new("Семейный репортёр", "Возьми интервью у члена семьи: задай 3 вопроса о его дне и запиши ответы.", "communication",
            ["общение", "семья"], 2, "Развивает эмпатию и умение слушать."),
        new("Домашний квест", "Найди 5 предметов, которые лежат не на месте, и убери их.", "home",
            ["дом", "порядок"], 1, "Быстрый способ навести порядок."),
        new("Мини-проект", "Составь список целей на неделю и укрась его наклейками.", "planning",
            ["планирование", "организация"], 3, "Создаёт ощущение контроля."),
        new("Дневник успехов", "Запиши 3 достижения за день и придумай награду за них.", "reflection",
            ["осознанность", "мотивация"], 1, "Формирует позитивный настрой.")
    ];

    private static readonly TaskTemplate[] TaskTemplatesEn =
    [
        new("Organize workspace", "Sort books and notebooks, wipe the desk, prepare materials for tomorrow.", "focus",
            ["study", "cleanliness"], 2, "Builds habit of preparing in advance."),
        new("Creative break", "Create a mini-comic about a family adventure in 20 minutes.", "creativity",
            ["drawing", "creativity"], 3, "Develops imagination and speech."),
        new("Science experiment", "Conduct a small experiment: measure how fast ice melts in different places.",
            "science", ["science", "experiment"], 3, "Supports interest in research."),
        new("Sports challenge", "Do 3 sets of exercises of your choice: plank, squats, or jumps.", "health",
            ["sports", "health"], 2, "Helps release energy."),
        new("Care mission", "Feed the pet, refresh the water, and add a note about its mood.", "responsibility",
            ["home", "care"], 1, "Teaches observation and caring."),
        new("Math blitz", "Solve 6 mental math problems or review the multiplication table.", "learning",
            ["math", "study"], 2, "Builds confidence in calculations."),
        new("Family reporter", "Interview a family member: " +
                                 "ask 3 questions about their day and write down the answers.", "communication", ["communication", "family"], 2,
            "Improves empathy and listening."),
        new("House quest", "Find 5 items that are not in their proper place and put them away.", "home",
            ["home", "organization"], 1, "Quick way to restore order."),
        new("Mini-project", "Make a list of goals for the week and decorate it with stickers.", "planning",
            ["planning", "organization"], 3, "Creates sense of control."),
        new("Success diary", "Write down 3 achievements of the day and think of a reward for them.", "reflection",
            ["mindfulness", "motivation"], 1, "Forms a positive outlook.")
    ];

    private static readonly RewardTemplate[] RewardTemplatesRu =
    [
        new("Пикник в гостиной", "Спонтанный пикник с пледом и любимым десертом.", 320, "family", "🍓",
            "Идеально для вечера выходного дня."),
        new("Дополнительное время на творчество", "30 минут для творчества или сборки конструктора.", 250, "creativity", "🎨",
            "Даёт пространство для самовыражения."),
        new("Настольная игра вместе", "Родитель выбирает настольную игру с ребёнком.", 280, "connection", "🎲",
            "Укрепляет семейные связи."),
        new("Личный плейлист", "Ребёнок выбирает музыку для поездки в машине или обеда.", 180, "music", "🎧",
            "Маленькая, но приятная привилегия."),
        new("Билет в мини-кинотеатр", "Выбор мультфильма с попкорном.", 420, "relax", "🎬",
            "Создаёт праздничную атмосферу."),
        new("Карточка добрых дел", "Сертификат на помощь родителя: уборка, готовка или проект.", 350, "support", "🤝",
            "Показывает взаимную заботу."),
        new("Ночной фонарик", "Чтение сказки или фонарик для палатки под столом.", 200, "imagination", "🔦",
            "Идеально для младших детей."),
        new("Мини-шопинг", "Онлайн-выбор наклеек или аксессуара в рамках бюджета.", 500, "shopping", "🛍️",
            "Учит управлению ресурсами.")
    ];

    private static readonly RewardTemplate[] RewardTemplatesEn =
    [
        new("Living room picnic", "Impromptu picnic with blanket and favorite dessert.", 320, "family", "🍓",
            "Perfect for a weekend evening."),
        new("Extra creative time", "30 minutes for creativity or building with construction sets.", 250, "creativity", "🎨",
            "Gives space for self-expression."),
        new("Board game together", "Parent chooses a board game with the child.", 280, "connection", "🎲",
            "Strengthens family bonds."),
        new("Private playlist", "Child chooses music for the car ride or lunch.", 180, "music", "🎧",
            "Small but pleasant privilege."),
        new("Mini-cinema ticket", "Choice of cartoon with popcorn.", 420, "relax", "🎬", "Creates festive atmosphere."),
        new("Good deeds card", "Certificate for parent's help: cleaning, cooking, or a project.", 350, "support", "🤝",
            "Shows mutual care."),
        new("Night flashlight", "Reading a fairy tale or flashlight for a tent under the table.", 200, "imagination", "🔦",
            "Perfect for younger kids."),
        new("Mini-shopping", "Online choice of stickers or accessory within budget.", 500, "shopping", "🛍️",
            "Teaches resource management.")
    ];

    /// <summary>Detect if text contains Cyrillic characters (Russian).</summary>
    private static bool IsRussian(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return true; // default to Russian
        foreach (var ch in text)
        {
            if (ch >= '\u0400' && ch <= '\u04FF') return true;
        }
        return false;
    }

    public Task<TaskSuggestionsResponse> GenerateTaskSuggestionsAsync(TaskSuggestionsRequest request,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (request is null) throw new ArgumentNullException(nameof(request));

        var ru = request.Language == null || request.Language.StartsWith("ru", StringComparison.OrdinalIgnoreCase);

        // If a specific description is provided, generate a single focused suggestion based on it.
        if (!string.IsNullOrWhiteSpace(request.TaskDescription))
        {
            var desc = request.TaskDescription!.Trim();
            var title = desc.Length > 50 ? desc.Substring(0, 50) + "..." : desc;
            var suggestion = new TaskSuggestion(
                title,
                desc,
                2,
                Array.Empty<string>(),
                "general",
                ru ? "Обсудите пользу вместе с ребёнком." : "Discuss the benefits with the child together.");

            var summary = ru
                ? "Задача сгенерирована на основе предоставленного описания."
                : "Task generated based on the provided description.";
            return Task.FromResult(new TaskSuggestionsResponse(new[] { suggestion }, summary, BuildTips(request, ru)));
        }

        var templates = ru ? TaskTemplatesRu : TaskTemplatesEn;
        var limit = request.ResolveLimit();
        var ordered = templates
            .Select(template => new
            {
                Template = template,
                Score = ScoreTemplate(template.Tags)
            })
            .OrderByDescending(x => x.Score)
            .ThenBy(_ => RandomNumberGenerator.GetInt32(0, 100))
            .Take(limit)
            .Select(x => x.Template.ToSuggestion(request))
            .ToList();

        if (ordered.Count == 0) return Task.FromResult(TaskSuggestionsResponse.Empty());

        var strategySummary = BuildTaskStrategySummary(request, ordered.Count, ru);
        var tips = BuildTips(request, ru);
        return Task.FromResult(new TaskSuggestionsResponse(ordered, strategySummary, tips));
    }

    public Task<RewardSuggestionsResponse> GenerateRewardSuggestionsAsync(RewardSuggestionsRequest request,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (request is null) throw new ArgumentNullException(nameof(request));

        var ru = request.Language == null || request.Language.StartsWith("ru", StringComparison.OrdinalIgnoreCase);
        var templates = ru ? RewardTemplatesRu : RewardTemplatesEn;

        var available = request.AvailablePoints ?? 400;
        var limit = request.ResolveLimit();
        var suggestions = templates
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

        var budgetSummary = BuildBudgetSummary(available, suggestions.Count, request.Occasion, ru);
        return Task.FromResult(new RewardSuggestionsResponse(suggestions, budgetSummary));
    }

    public Task<AiChatResponse> ProcessChatAsync(AiChatRequest request, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (request is null) throw new ArgumentNullException(nameof(request));
        if (string.IsNullOrWhiteSpace(request.Message))
            throw new ArgumentException("Message cannot be empty.", nameof(request));

        var conversationId = string.IsNullOrWhiteSpace(request.ConversationId)
            ? Guid.NewGuid().ToString("N")
            : request.ConversationId;

        var ru = IsRussian(request.Message);
        var contextHint = ResolveContextHint(request.Context, ru);
        var reply = new StringBuilder();
        reply.AppendLine(contextHint);
        reply.AppendLine();
        reply.AppendLine(ru
            ? $"Вот что можно сделать: {BuildAnswerCore(request.Message, ru)}"
            : $"Here's what you can do: {BuildAnswerCore(request.Message, ru)}");

        var followUps = BuildFollowUps(request.Message, request.Context, ru);
        var actions = BuildActionsForMessage(request.Message, ru);
        return Task.FromResult(new AiChatResponse(conversationId, reply.ToString().Trim(), followUps, actions,
            timeProvider.GetUtcNow()));
    }

    private static IReadOnlyCollection<AiAction> BuildActionsForMessage(string message, bool ru)
    {
        var actions = new List<AiAction>();
        var lowerMsg = message.ToLowerInvariant();

        if (lowerMsg.Contains("задач") || lowerMsg.Contains("создай") || lowerMsg.Contains("добав")
            || lowerMsg.Contains("task") || lowerMsg.Contains("create") || lowerMsg.Contains("add"))
        {
            actions.Add(new AiAction
            {
                Type = AiActionType.CreateTask,
                Label = ru ? "Создать задачу" : "Create task",
                Description = ru ? "Создать новую задачу по вашему запросу" : "Create a new task based on your request",
                Variant = "primary",
                Priority = 1,
                Payload = new CreateTaskPayload
                {
                    Title = ru ? "Новая задача" : "New task",
                    Description = ru ? "Описание задачи по вашему запросу" : "Task description based on your request",
                    Difficulty = 2,
                    RewardXp = 80,
                    RewardPoints = 20,
                    Category = "general"
                }
            });
        }

        if (lowerMsg.Contains("наград") || lowerMsg.Contains("приз") || lowerMsg.Contains("поощрен")
            || lowerMsg.Contains("reward") || lowerMsg.Contains("prize") || lowerMsg.Contains("bonus"))
        {
            actions.Add(new AiAction
            {
                Type = AiActionType.CreateReward,
                Label = ru ? "Создать награду" : "Create reward",
                Description = ru ? "Добавить новую награду в магазин" : "Add a new reward to the shop",
                Variant = "secondary",
                Priority = 2,
                Payload = new CreateRewardPayload
                {
                    Title = ru ? "Новая награда" : "New reward",
                    Description = ru ? "Награда за достижения" : "Reward for achievements",
                    Cost = 200,
                    Category = "general",
                    Icon = "🎁"
                }
            });
        }

        if (lowerMsg.Contains("выполн") || lowerMsg.Contains("готов") || lowerMsg.Contains("заверш")
            || lowerMsg.Contains("complete") || lowerMsg.Contains("done") || lowerMsg.Contains("finish"))
        {
            actions.Add(new AiAction
            {
                Type = AiActionType.CompleteTask,
                Label = ru ? "Завершить задачу" : "Complete task",
                Description = ru ? "Отметить задачу как выполненную" : "Mark the task as completed",
                Variant = "primary",
                Priority = 1,
                Payload = null
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

        var ru = request.Language == null || request.Language.StartsWith("ru", StringComparison.OrdinalIgnoreCase);
        var window = request.ResolveWindow();
        var limit = request.ResolveLimit();
        var insights = GenerateInsights(window, limit, ru).ToList();
        var summary = ru
            ? new Dictionary<string, string>
            {
                ["window"] = $"Последние {window} дней",
                ["focus"] = insights.Any(i => i.Type == "progress") ? "Прогресс стабильный" : "Есть возможности для роста",
                ["recommendation"] = "Поддерживайте короткие циклы обратной связи и обновляйте награды каждые 2 недели."
            }
            : new Dictionary<string, string>
            {
                ["window"] = $"Last {window} days",
                ["focus"] = insights.Any(i => i.Type == "progress") ? "Progress is stable" : "There are growth opportunities",
                ["recommendation"] = "Maintain short feedback cycles and update rewards every 2 weeks."
            };

        return Task.FromResult(new AiAnalyticsResponse(insights, summary));
    }

    private static IReadOnlyCollection<string> BuildTips(TaskSuggestionsRequest request, bool ru)
    {
        var tips = new List<string>();
        if (request.ChildAge is >= 6 and <= 10)
            tips.Add(ru
                ? "Используйте визуальные трекеры прогресса — они хорошо работают для младших детей."
                : "Use visual progress trackers — they work well for younger children.");

        if (tips.Count == 0)
            tips.Add(ru
                ? "Проверьте настроение ребёнка перед началом — это помогает задать правильный тон общения."
                : "Check the child's mood before starting — it helps set the right tone for communication.");

        return tips;
    }

    private static string BuildTaskStrategySummary(TaskSuggestionsRequest request, int count, bool ru)
    {
        return ru
            ? $"Подготовлен набор из {count} заданий для сбалансированного развития. Корректируйте сложность каждые 2-3 дня."
            : $"Prepared a set of {count} tasks focused on balanced development. Adjust difficulty every 2-3 days.";
    }

    private static string BuildBudgetSummary(int availablePoints, int count, string? occasion, bool ru)
    {
        if (ru)
        {
            var occasionPart = string.IsNullOrWhiteSpace(occasion) ? "" : $" для события «{occasion}»";
            return $"Выбрано {count} наград{occasionPart}. Рекомендуемый резерв: {availablePoints} баллов.";
        }
        else
        {
            var occasionPart = string.IsNullOrWhiteSpace(occasion) ? "" : $" for the event \"{occasion}\"";
            return $"Selected {count} rewards{occasionPart}. Recommended reserve: {availablePoints} points.";
        }
    }

    private static string ResolveContextHint(IReadOnlyDictionary<string, string> context, bool ru)
    {
        if (context.TryGetValue("childName", out var name) && !string.IsNullOrWhiteSpace(name))
            return ru ? $"{name}, давай разберёмся вместе!" : $"{name}, let's figure this out together!";

        if (context.TryGetValue("audience", out var audience))
            return audience switch
            {
                "parent" => ru ? "Собрал рекомендации для родителя:" : "I've gathered recommendations for the parent:",
                "child" => ru ? "Привет! Вот что ты можешь сделать:" : "Hi! Here's what you can do:",
                _ => ru ? "Вот план действий:" : "Here's the action plan:"
            };

        return ru ? "Вот план действий:" : "Here's the action plan:";
    }

    private static string BuildAnswerCore(string message, bool ru)
    {
        if (message.Contains("мотива", StringComparison.OrdinalIgnoreCase)
            || message.Contains("motivat", StringComparison.OrdinalIgnoreCase))
            return ru
                ? "разбейте цель на короткие шаги, добавьте мгновенную награду и объясните, какая польза придёт завтра."
                : "break down the goal into short steps, add an instant reward, and explain what benefit will come tomorrow.";

        if (message.Contains("награ", StringComparison.OrdinalIgnoreCase)
            || message.Contains("reward", StringComparison.OrdinalIgnoreCase)
            || message.Contains("prize", StringComparison.OrdinalIgnoreCase))
            return ru
                ? "сочетайте быстрые микро-награды (наклейки, выбор музыки) с долгосрочными призами, чтобы видеть прогресс каждый день."
                : "mix quick micro-rewards (stickers, music choice) with long-term prizes to see progress daily.";

        if (message.Contains("задач", StringComparison.OrdinalIgnoreCase)
            || message.Contains("task", StringComparison.OrdinalIgnoreCase))
            return ru
                ? "задачи лучше группировать в тематические блоки и выполнять по одному блоку вечером для видимых результатов."
                : "tasks are best grouped into themed blocks and complete one block per evening to see results.";

        return ru
            ? "разбейте запрос на 3 шага: обсудите ожидания, согласуйте правила и закрепите коротким ритуалом."
            : "break down the request into 3 steps: discuss expectations, agree on rules, and reinforce with a short ritual.";
    }

    private static IReadOnlyCollection<string> BuildFollowUps(string message,
        IReadOnlyDictionary<string, string> context, bool ru)
    {
        var followUps = ru
            ? new List<string>
            {
                "Хотите уточнить длительность или сложность задачи?",
                "Хотите идеи для системы наград?"
            }
            : new List<string>
            {
                "Would you like to clarify duration or difficulty of the task?",
                "Would you like ideas for a reward system?"
            };

        if (context.ContainsKey("childName"))
            followUps.Add(ru
                ? "Расскажите, что ребёнку нравится больше всего — это сделает рекомендации точнее."
                : "Tell me what the child likes most — this will make recommendations more accurate.");

        if (message.Contains("учёб", StringComparison.OrdinalIgnoreCase)
            || message.Contains("homework", StringComparison.OrdinalIgnoreCase)
            || message.Contains("study", StringComparison.OrdinalIgnoreCase))
            followUps.Add(ru
                ? "Нужен ли план подготовки домашних заданий на неделю?"
                : "Do you need a homework preparation plan for the week?");

        return followUps;
    }

    private static IEnumerable<AiInsightCard> GenerateInsights(int windowDays, int limit, bool ru)
    {
        var baseCards = ru
            ? new List<AiInsightCard>
            {
                new("warning", "Нужен перерыв",
                    "Активность ребёнка снижается вечером. Планируйте лёгкие задачи после 19:00.", "medium",
                    ["режим", "энергия"]),
                new("progress", "Сильная сторона",
                    "Уровень вовлечённости в обучающие задачи вырос на 18% за последние недели.",
                    "success", ["обучение", "фокус"]),
                new("insight", "Экономика наград",
                    "Средняя стоимость наград выросла. Добавьте больше бонусов до 200 баллов.", "info",
                    ["награды", "бюджет"]),
                new("tip", "Командная цель",
                    $"Попробуйте семейную миссию на {windowDays} дней для закрепления новой привычки.", "info",
                    ["семья", "привычки"])
            }
            : new List<AiInsightCard>
            {
                new("warning", "Need a break",
                    "The child's activity decreases in the evening. Schedule light tasks after 7 PM.", "medium",
                    ["routine", "energy"]),
                new("progress", "Strong point", "Engagement level in learning tasks increased by 18% over recent weeks.",
                    "success", ["learning", "focus"]),
                new("insight", "Reward economy",
                    "Average reward cost increased. Add more bonuses under 200 points.", "info",
                    ["rewards", "budget"]),
                new("tip", "Team goal",
                    $"Try a family mission for {windowDays} days to reinforce a new habit.", "info",
                    ["family", "habits"])
            };

        return baseCards.Take(limit);
    }

    // Overload used for task suggestions path (no interests/goals/recent tasks)
    private static double ScoreTemplate(IReadOnlyCollection<string> templateTags)
    {
        // Simple rule: base score plus small random jitter so results vary
        return 1.0 + RandomNumberGenerator.GetInt32(0, 100) / 100.0;
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
        string ImpactSummary)
    {
        public TaskSuggestion ToSuggestion(TaskSuggestionsRequest request)
        {
            return new TaskSuggestion(
                Title,
                Description,
                Difficulty,
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