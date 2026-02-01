using System.Security.Cryptography;
using System.Text;
using AiService.Application.Abstractions;
using AiService.Application.Contracts;

namespace AiService.Infrastructure.Orchestration;

public sealed class RuleBasedAiOrchestrator(TimeProvider timeProvider) : IAiOrchestrator
{
    private static readonly TaskTemplate[] TaskTemplates =
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

    private static readonly RewardTemplate[] RewardTemplates =
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

    public Task<TaskSuggestionsResponse> GenerateTaskSuggestionsAsync(TaskSuggestionsRequest request,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (request is null) throw new ArgumentNullException(nameof(request));

        // If a specific description is provided, generate a single focused suggestion based on it.
        if (!string.IsNullOrWhiteSpace(request.TaskDescription))
        {
            var desc = request.TaskDescription!.Trim();
            var title = desc.Length > 50 ? desc.Substring(0, 50) + "..." : desc;
            var suggestion = new TaskSuggestion(
                title,
                desc,
                2, // default difficulty when not inferred
                Array.Empty<string>(),
                "general",
                "Discuss the benefits with the child together.");

            return Task.FromResult(new TaskSuggestionsResponse(new[] { suggestion }, "Task generated based on the provided description.", BuildTips(request)));
        }

        var limit = request.ResolveLimit();
        var ordered = TaskTemplates
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

        var summary = BuildTaskStrategySummary(request, ordered.Count);
        var tips = BuildTips(request);
        return Task.FromResult(new TaskSuggestionsResponse(ordered, summary, tips));
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
            throw new ArgumentException("Message cannot be empty.", nameof(request));

        var conversationId = string.IsNullOrWhiteSpace(request.ConversationId)
            ? Guid.NewGuid().ToString("N")
            : request.ConversationId;

        var contextHint = ResolveContextHint(request.Context);
        var reply = new StringBuilder();
        reply.AppendLine(contextHint);
        reply.AppendLine();
        reply.AppendLine($"Here's what you can do: {BuildAnswerCore(request.Message)}");

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
                Label = "Create task",
                Description = "Create a new task based on your request",
                Variant = "primary",
                Priority = 1,
                Payload = new CreateTaskPayload
                {
                    Title = "New task",
                    Description = "Task description based on your request",
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
                Label = "Create reward",
                Description = "Add a new reward to the shop",
                Variant = "secondary",
                Priority = 2,
                Payload = new CreateRewardPayload
                {
                    Title = "New reward",
                    Description = "Reward for achievements",
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
            ["window"] = $"Last {window} days",
            ["focus"] = insights.Any(i => i.Type == "progress") ? "Progress is stable" : "There are growth opportunities",
            ["recommendation"] = "Maintain short feedback cycles and update rewards every 2 weeks."
        };

        return Task.FromResult(new AiAnalyticsResponse(insights, summary));
    }

    private static IReadOnlyCollection<string> BuildTips(TaskSuggestionsRequest request)
    {
        var tips = new List<string>();
        if (request.ChildAge is >= 6 and <= 10)
            tips.Add("Use visual progress trackers — they work well for younger children.");

        // General tip if no age-specific tip applies
        if (tips.Count == 0)
            tips.Add("Check the child's mood before starting — it helps set the right tone for communication.");

        return tips;
    }

    private static string BuildTaskStrategySummary(TaskSuggestionsRequest request, int count)
    {
        var focus = "balanced development";
        return $"Prepared a set of {count} tasks focused on {focus}. Adjust difficulty every 2-3 days.";
    }

    private static string BuildBudgetSummary(int availablePoints, int count, string? occasion)
    {
        var occasionPart = string.IsNullOrWhiteSpace(occasion)
            ? ""
            : $" for the event \"{occasion}\"";
        return $"Selected {count} rewards{occasionPart}. Recommended reserve: {availablePoints} points.";
    }

    private static string ResolveContextHint(IReadOnlyDictionary<string, string> context)
    {
        if (context.TryGetValue("childName", out var name) && !string.IsNullOrWhiteSpace(name))
            return $"{name}, let's figure this out together!";

        if (context.TryGetValue("audience", out var audience))
            return audience switch
            {
                "parent" => "I've gathered recommendations for the parent:",
                "child" => "Hi! Here's what you can do:",
                _ => "Here's the action plan:"
            };

        return "Here's the action plan:";
    }

    private static string BuildAnswerCore(string message)
    {
        if (message.Contains("мотива", StringComparison.OrdinalIgnoreCase))
            return
                "break down the goal into short steps, add an instant reward, and explain what benefit will come tomorrow.";

        if (message.Contains("награ", StringComparison.OrdinalIgnoreCase))
            return
                "mix quick micro-rewards (stickers, music choice) with long-term prizes to see progress daily.";

        if (message.Contains("задач", StringComparison.OrdinalIgnoreCase))
            return
                "tasks are best grouped into themed blocks and complete one block per evening to see results.";

        return
            "break down the request into 3 steps: discuss expectations, agree on rules, and reinforce with a short ritual.";
    }

    private static IReadOnlyCollection<string> BuildFollowUps(string message,
        IReadOnlyDictionary<string, string> context)
    {
        var followUps = new List<string>
        {
            "Would you like to clarify duration or difficulty of the task?",
            "Would you like ideas for a reward system?"
        };

        if (context.ContainsKey("childName"))
            followUps.Add("Tell me what the child likes most — this will make recommendations more accurate.");

        if (message.Contains("учёб", StringComparison.OrdinalIgnoreCase))
            followUps.Add("Do you need a homework preparation plan for the week?");

        return followUps;
    }

    private static IEnumerable<AiInsightCard> GenerateInsights(int windowDays, int limit)
    {
        var baseCards = new List<AiInsightCard>
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
                "Try a family mission for {windowDays} days to reinforce a new habit.", "info",
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
            var personalizedDescription = Description;
            if (!string.IsNullOrWhiteSpace(request.ChildId))
                personalizedDescription = Description + " Share the result in the family chat.";

            return new TaskSuggestion(
                Title,
                personalizedDescription,
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