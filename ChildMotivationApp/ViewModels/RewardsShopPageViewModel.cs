using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Collections.Specialized;
using System.ComponentModel;
using System.Globalization;
using System.Linq;
using System.Windows.Input;
using ChildMotivationApp.Commands;
using ChildMotivationApp.Helpers;
using ChildMotivationApp.Services;
using Microsoft.Maui.Controls;
using Microsoft.Maui.Graphics;

namespace ChildMotivationApp.ViewModels;

public sealed class RewardsShopPageViewModel : ViewModelBase
{
    private const string AllCategoryKey = "all";
    private RewardCategory? _selectedCategory;
    private string _searchQuery = string.Empty;
    private string _selectedSortOption;
    private int _visibleRewardsCount;
    private bool _isEditorVisible;
    private readonly IReadOnlyDictionary<string, RewardStyling> _categoryStyles;
    private readonly AsyncCommand<RewardItem> _redeemRewardCommand;
    private readonly AsyncCommand<RewardItem> _showRewardOptionsCommand;

    public RewardsShopPageViewModel(
        INavigationService navigationService,
        IDialogService dialogService)
        : base(navigationService, dialogService)
    {
        _categoryStyles = CreateCategoryStyles();
        Categories = new ObservableCollection<RewardCategory>(CreateDefaultCategories());
        Rewards = new ObservableCollection<RewardItem>(CreateDefaultRewards());
        Rewards.CollectionChanged += OnRewardsCollectionChanged;
        foreach (var reward in Rewards)
        {
            SubscribeToReward(reward);
        }
        FilteredRewards = new ObservableCollection<RewardItem>();

    EditorCategories = new ObservableCollection<RewardEditorCategoryOption>(CreateEditorCategoryOptions());
    EditorState = new RewardEditorState();
    EditorState.LoadForCreate(EditorCategories.FirstOrDefault());

        SortOptions = new List<string>
        {
            "По актуальности",
            "Стоимость: по возрастанию",
            "Стоимость: по убыванию",
            "Название: A-Z"
        };

        ToggleCategoryCommand = new Command<RewardCategory?>(OnToggleCategory);
        ClearFiltersCommand = new Command(OnClearFilters);
        RefreshCommand = new Command(ApplyFilters);
        OpenAddRewardCommand = new Command(OnOpenAddReward);
        OpenEditRewardCommand = new Command<RewardItem>(OnOpenEditReward);
        ToggleRewardActivationCommand = new Command<RewardItem>(OnToggleRewardActivation);
        SaveRewardCommand = new Command(OnSaveReward);
        CancelEditorCommand = new Command(OnCancelEditor);

        _redeemRewardCommand = new AsyncCommand<RewardItem>(OnRedeemRewardAsync);
        _showRewardOptionsCommand = new AsyncCommand<RewardItem>(OnShowRewardOptionsAsync);

        _selectedSortOption = SortOptions[0];
        SelectedCategory = Categories.FirstOrDefault(category => category.Key == AllCategoryKey) ?? Categories.FirstOrDefault();
    }

    public ObservableCollection<RewardCategory> Categories { get; }

    public ObservableCollection<RewardItem> Rewards { get; }

    public ObservableCollection<RewardItem> FilteredRewards { get; }

    public ObservableCollection<RewardEditorCategoryOption> EditorCategories { get; }

    public IList<string> SortOptions { get; }

    public ICommand ToggleCategoryCommand { get; }

    public ICommand ClearFiltersCommand { get; }

    public ICommand RefreshCommand { get; }

    public ICommand OpenAddRewardCommand { get; }

    public ICommand OpenEditRewardCommand { get; }

    public ICommand ToggleRewardActivationCommand { get; }

    public ICommand SaveRewardCommand { get; }

    public ICommand CancelEditorCommand { get; }

    public ICommand RedeemRewardCommand => _redeemRewardCommand;

    public ICommand ShowRewardOptionsCommand => _showRewardOptionsCommand;

    public int AvailablePoints => 1420;

    public int RedeemedThisMonth => 480;

    public RewardEditorState EditorState { get; }

    public bool IsEditorVisible
    {
        get => _isEditorVisible;
        private set => SetProperty(ref _isEditorVisible, value);
    }

    public int VisibleRewardsCount
    {
        get => _visibleRewardsCount;
        private set => SetProperty(ref _visibleRewardsCount, value);
    }

    public string SearchQuery
    {
        get => _searchQuery;
        set
        {
            if (SetProperty(ref _searchQuery, value))
            {
                ApplyFilters();
            }
        }
    }

    public RewardCategory? SelectedCategory
    {
        get => _selectedCategory;
        set
        {
            if (SetProperty(ref _selectedCategory, value))
            {
                foreach (var category in Categories)
                {
                    category.IsSelected = value != null && category == value;
                }

                ApplyFilters();
            }
        }
    }

    public string SelectedSortOption
    {
        get => _selectedSortOption;
        set
        {
            if (SetProperty(ref _selectedSortOption, value))
            {
                ApplyFilters();
            }
        }
    }

    public string ActiveFiltersSummary
    {
        get
        {
            var parts = new List<string>();

            if (SelectedCategory is not null && SelectedCategory.Key != AllCategoryKey)
            {
                parts.Add(SelectedCategory.DisplayName);
            }

            if (!string.IsNullOrWhiteSpace(SearchQuery))
            {
                parts.Add($"по запросу \"{SearchQuery}\"");
            }

            return parts.Count == 0 ? "Все награды" : string.Join(", ", parts);
        }
    }

    private void OnToggleCategory(RewardCategory? tappedCategory)
    {
        if (tappedCategory is null)
        {
            return;
        }

        if (tappedCategory.Key == AllCategoryKey)
        {
            SelectedCategory = tappedCategory;
            return;
        }

        SelectedCategory = SelectedCategory == tappedCategory ? GetAllCategory() : tappedCategory;
    }

    private void OnClearFilters()
    {
        if (string.IsNullOrEmpty(SearchQuery) && SelectedCategory is null && SelectedSortOption == SortOptions[0])
        {
            return;
        }

        SearchQuery = string.Empty;
        SelectedCategory = GetAllCategory();
        SelectedSortOption = SortOptions[0];
        ApplyFilters();
    }

    private void ApplyFilters()
    {
        var query = Rewards.AsEnumerable();

        var categoryKey = SelectedCategory?.Key;
        if (!string.IsNullOrWhiteSpace(categoryKey) && categoryKey != AllCategoryKey)
        {
            query = query.Where(r => r.CategoryKey == categoryKey);
        }

        if (!string.IsNullOrWhiteSpace(SearchQuery))
        {
            var lower = SearchQuery.Trim().ToLowerInvariant();
            query = query.Where(r =>
                r.Title.ToLowerInvariant().Contains(lower) ||
                (r.Description?.ToLowerInvariant().Contains(lower) ?? false));
        }

        var ordered = query.OrderByDescending(r => r.IsActive);

        ordered = SelectedSortOption switch
        {
            "Стоимость: по возрастанию" => ordered.ThenBy(r => r.Points).ThenBy(r => r.Title),
            "Стоимость: по убыванию" => ordered.ThenByDescending(r => r.Points).ThenBy(r => r.Title),
            "Название: A-Z" => ordered.ThenBy(r => r.Title),
            _ => ordered.ThenByDescending(r => r.IsFeatured).ThenBy(r => r.Points)
        };

        // Sync observable collection
        var filtered = ordered.ToList();

        FilteredRewards.BeginBatchUpdate(filtered);
        VisibleRewardsCount = filtered.Count;

        OnPropertyChanged(nameof(ActiveFiltersSummary));
    }

    private void OnRewardsCollectionChanged(object? sender, NotifyCollectionChangedEventArgs e)
    {
        if (e.OldItems is not null)
        {
            foreach (RewardItem oldItem in e.OldItems)
            {
                UnsubscribeFromReward(oldItem);
            }
        }

        if (e.NewItems is not null)
        {
            foreach (RewardItem newItem in e.NewItems)
            {
                SubscribeToReward(newItem);
            }
        }

        ApplyFilters();
    }

    private void SubscribeToReward(RewardItem reward)
    {
        reward.PropertyChanged += OnRewardPropertyChanged;
    }

    private void UnsubscribeFromReward(RewardItem reward)
    {
        reward.PropertyChanged -= OnRewardPropertyChanged;
    }

    private void OnRewardPropertyChanged(object? sender, PropertyChangedEventArgs e)
    {
        if (sender is not RewardItem)
        {
            return;
        }

        switch (e.PropertyName)
        {
            case nameof(RewardItem.IsActive):
            case nameof(RewardItem.IsFeatured):
            case nameof(RewardItem.Points):
            case nameof(RewardItem.Title):
            case nameof(RewardItem.CategoryKey):
            case nameof(RewardItem.CategoryName):
                ApplyFilters();
                break;
        }
    }

    private void OnOpenAddReward()
    {
        var defaultCategory = EditorCategories.FirstOrDefault();
        EditorState.LoadForCreate(defaultCategory);
        IsEditorVisible = true;
    }

    private void OnOpenEditReward(RewardItem? reward)
    {
        if (reward is null)
        {
            return;
        }

        var categoryOption = EnsureEditorCategoryFromKey(reward.CategoryKey, reward.CategoryName) ?? EditorCategories.FirstOrDefault();
        EditorState.LoadFromReward(reward, categoryOption);
        IsEditorVisible = true;
    }

    private void OnCancelEditor()
    {
        EditorState.ResetValidation();
        IsEditorVisible = false;
    }

    private void OnToggleRewardActivation(RewardItem? reward)
    {
        if (reward is null)
        {
            return;
        }

        reward.IsActive = !reward.IsActive;
    }

    private async Task OnRedeemRewardAsync(RewardItem? reward)
    {
        if (reward is null)
        {
            return;
        }

        await DialogService.ShowAlertAsync(
            "Награда сохранена",
            $"\"{reward.Title}\" отмечена как выбранная. Скоро добавим запись в историю.",
            "Отлично");
    }

    private async Task OnShowRewardOptionsAsync(RewardItem? reward)
    {
        if (reward is null)
        {
            return;
        }

        var toggleLabel = reward.IsActive ? "Деактивировать" : "Активировать";
        var action = await DialogService.ShowActionSheetAsync(reward.Title, "Отмена", null, "Редактировать", toggleLabel);

        if (string.IsNullOrWhiteSpace(action) || action == "Отмена")
        {
            return;
        }

        if (action == "Редактировать" && OpenEditRewardCommand?.CanExecute(reward) == true)
        {
            OpenEditRewardCommand.Execute(reward);
            return;
        }

        if (action == toggleLabel && ToggleRewardActivationCommand?.CanExecute(reward) == true)
        {
            ToggleRewardActivationCommand.Execute(reward);
        }
    }

    private void OnSaveReward()
    {
        if (!TryValidateEditor(out var points, out var categoryOption))
        {
            return;
        }

        var trimmedTitle = EditorState.Title.Trim();
        var trimmedDescription = string.IsNullOrWhiteSpace(EditorState.Description) ? null : EditorState.Description.Trim();
        var trimmedEstimation = string.IsNullOrWhiteSpace(EditorState.Estimation) ? null : EditorState.Estimation.Trim();
        var trimmedPopularity = string.IsNullOrWhiteSpace(EditorState.Popularity) ? null : EditorState.Popularity.Trim();

        if (EditorState.TargetReward is null)
        {
            var newReward = new RewardItem(
                trimmedTitle,
                trimmedDescription,
                categoryOption?.Key ?? AllCategoryKey,
                categoryOption?.DisplayName ?? trimmedTitle,
                points,
                categoryOption?.AccentStart ?? Color.FromArgb("#6366F1"),
                categoryOption?.AccentEnd ?? Color.FromArgb("#8B5CF6"),
                categoryOption?.BadgeBackground ?? Color.FromArgb("#EEF2FF"),
                categoryOption?.Icon ?? "gift.png")
            {
                IsFeatured = EditorState.IsFeatured,
                IsActive = EditorState.IsActive,
                Estimation = trimmedEstimation,
                Popularity = trimmedPopularity
            };

            Rewards.Add(newReward);
        }
        else
        {
            var reward = EditorState.TargetReward;
            reward.Title = trimmedTitle;
            reward.Description = trimmedDescription;
            reward.CategoryKey = categoryOption?.Key ?? reward.CategoryKey;
            reward.CategoryName = categoryOption?.DisplayName ?? reward.CategoryName;
            reward.Points = points;
            reward.AccentGradientStart = categoryOption?.AccentStart ?? reward.AccentGradientStart;
            reward.AccentGradientEnd = categoryOption?.AccentEnd ?? reward.AccentGradientEnd;
            reward.BadgeBackground = categoryOption?.BadgeBackground ?? reward.BadgeBackground;
            reward.Icon = categoryOption?.Icon ?? reward.Icon;
            reward.IsFeatured = EditorState.IsFeatured;
            reward.IsActive = EditorState.IsActive;
            reward.Estimation = trimmedEstimation;
            reward.Popularity = trimmedPopularity;
        }

        EditorState.ResetAfterSave();
        IsEditorVisible = false;
    }

    private bool TryValidateEditor(out int points, out RewardEditorCategoryOption? categoryOption)
    {
        EditorState.ResetValidation();
        categoryOption = EditorState.SelectedCategory ?? EditorCategories.FirstOrDefault();

        if (string.IsNullOrWhiteSpace(EditorState.Title))
        {
            EditorState.SetError("Введите название награды.");
            points = 0;
            return false;
        }

        if (!int.TryParse(EditorState.PointsInput, NumberStyles.Integer, CultureInfo.InvariantCulture, out points) || points <= 0)
        {
            EditorState.SetError("Укажите положительное количество очков.");
            return false;
        }

        if (categoryOption is null)
        {
            EditorState.SetError("Выберите категорию.");
            return false;
        }

        return true;
    }

    private RewardEditorCategoryOption? EnsureEditorCategoryFromKey(string categoryKey, string? fallbackDisplayName = null)
    {
        if (string.IsNullOrWhiteSpace(categoryKey))
        {
            return null;
        }

        var existing = EditorCategories.FirstOrDefault(option => option.Key == categoryKey);
        if (existing is not null)
        {
            return existing;
        }

        if (_categoryStyles.TryGetValue(categoryKey, out var styling))
        {
            var option = new RewardEditorCategoryOption(categoryKey, styling.DisplayName, styling.Icon, styling.AccentStart, styling.AccentEnd, styling.BadgeBackground);
            EditorCategories.Add(option);
            return option;
        }

        if (!string.IsNullOrWhiteSpace(fallbackDisplayName))
        {
            var option = new RewardEditorCategoryOption(categoryKey, fallbackDisplayName, "gift.png", Color.FromArgb("#6366F1"), Color.FromArgb("#8B5CF6"), Color.FromArgb("#EEF2FF"));
            EditorCategories.Add(option);
            return option;
        }

        return null;
    }

    private IEnumerable<RewardEditorCategoryOption> CreateEditorCategoryOptions()
    {
        foreach (var kvp in _categoryStyles)
        {
            if (kvp.Key == AllCategoryKey)
            {
                continue;
            }

            yield return new RewardEditorCategoryOption(kvp.Key, kvp.Value.DisplayName, kvp.Value.Icon, kvp.Value.AccentStart, kvp.Value.AccentEnd, kvp.Value.BadgeBackground);
        }
    }

    private IReadOnlyDictionary<string, RewardStyling> CreateCategoryStyles()
    {
        return new Dictionary<string, RewardStyling>
        {
            ["all"] = new RewardStyling("Все", Color.FromArgb("#6366F1"), Color.FromArgb("#8B5CF6"), Color.FromArgb("#E0E7FF"), "gift.png"),
            ["fun"] = new RewardStyling("Развлечения", Color.FromArgb("#A855F7"), Color.FromArgb("#EC4899"), Color.FromArgb("#FDF4FF"), "gift.png"),
            ["education"] = new RewardStyling("Развитие", Color.FromArgb("#3B82F6"), Color.FromArgb("#60A5FA"), Color.FromArgb("#EFF6FF"), "star.png"),
            ["family"] = new RewardStyling("Семья", Color.FromArgb("#10B981"), Color.FromArgb("#14B8A6"), Color.FromArgb("#ECFDF5"), "heart.png"),
            ["household"] = new RewardStyling("Дом", Color.FromArgb("#F59E0B"), Color.FromArgb("#F97316"), Color.FromArgb("#FFF7ED"), "home.png"),
            ["wellbeing"] = new RewardStyling("Здоровье", Color.FromArgb("#0EA5E9"), Color.FromArgb("#38BDF8"), Color.FromArgb("#E0F2FE"), "child.png"),
            ["longterm"] = new RewardStyling("Долгосрочные", Color.FromArgb("#7C3AED"), Color.FromArgb("#8B5CF6"), Color.FromArgb("#EDE9FE"), "gift.png")
        };
    }

    private RewardCategory? GetAllCategory() => Categories.FirstOrDefault(category => category.Key == AllCategoryKey);

    private static IEnumerable<RewardCategory> CreateDefaultCategories()
    {
        yield return new RewardCategory("all", "Все", Color.FromArgb("#4338CA"), Color.FromArgb("#E0E7FF"))
        {
            Icon = "gift.png"
        };
        yield return new RewardCategory("fun", "Развлечения", Color.FromArgb("#D946EF"), Color.FromArgb("#F5E0FF"))
        {
            Icon = "gift.png"
        };
        yield return new RewardCategory("education", "Развитие", Color.FromArgb("#2563EB"), Color.FromArgb("#DBEAFE"))
        {
            Icon = "star.png"
        };
        yield return new RewardCategory("family", "Семья", Color.FromArgb("#059669"), Color.FromArgb("#DCFCE7"))
        {
            Icon = "heart.png"
        };
        yield return new RewardCategory("household", "Дом", Color.FromArgb("#F59E0B"), Color.FromArgb("#FEF3C7"))
        {
            Icon = "home.png"
        };
        yield return new RewardCategory("wellbeing", "Здоровье", Color.FromArgb("#0EA5E9"), Color.FromArgb("#E0F2FE"))
        {
            Icon = "child.png"
        };
        yield return new RewardCategory("longterm", "Долгосрочные", Color.FromArgb("#7C3AED"), Color.FromArgb("#EDE9FE"))
        {
            Icon = "gift.png"
        };
    }

    private static IEnumerable<RewardItem> CreateDefaultRewards()
    {
        yield return new RewardItem(
            "Вечер кино", "Выбираем семейный фильм и готовим попкорн.", "fun", "Развлечения",
            points: 120,
            accentStart: Color.FromArgb("#A855F7"),
            accentEnd: Color.FromArgb("#EC4899"),
            badgeBackground: Color.FromArgb("#FDF4FF"),
            icon: "gift.png")
        {
            IsFeatured = true,
            Estimation = "~1 вечер",
            Popularity = "Часто выбирают"
        };

        yield return new RewardItem(
            "Мороженое выходного дня", "Совместный поход за любимым мороженым.", "fun", "Развлечения",
            80,
            Color.FromArgb("#F59E0B"),
            Color.FromArgb("#F97316"),
            Color.FromArgb("#FFF7ED"),
            "heart.png")
        {
            Estimation = "~30 минут",
            Popularity = "Любимый десерт"
        };

        yield return new RewardItem(
            "Час настольных игр", "Выбираем новую игру или хит семьи.", "family", "Семья",
            90,
            Color.FromArgb("#10B981"),
            Color.FromArgb("#14B8A6"),
            Color.FromArgb("#ECFDF5"),
            "team.png")
        {
            Estimation = "~1 час",
            Popularity = "Объединяет семью"
        };

        yield return new RewardItem(
            "Пропуск уборки", "Можно пропустить уборку комнаты один раз.", "household", "Дом",
            70,
            Color.FromArgb("#6366F1"),
            Color.FromArgb("#8B5CF6"),
            Color.FromArgb("#EEF2FF"),
            "home.png")
        {
            Estimation = "экономит 20 мин",
            Popularity = "Награда-выходной"
        };

        yield return new RewardItem(
            "Новая книга", "Позволяет выбрать и купить книгу до 500₽.", "education", "Развитие",
            200,
            Color.FromArgb("#3B82F6"),
            Color.FromArgb("#60A5FA"),
            Color.FromArgb("#EFF6FF"),
            "star.png")
        {
            Estimation = "Долгосрочная",
            Popularity = "Мотивирует учиться"
        };

        yield return new RewardItem(
            "Семейная прогулка", "Выбираем место прогулки на свежем воздухе.", "wellbeing", "Здоровье",
            110,
            Color.FromArgb("#0EA5E9"),
            Color.FromArgb("#38BDF8"),
            Color.FromArgb("#E0F2FE"),
            "child.png")
        {
            Estimation = "~2 часа",
            Popularity = "Тренд недели"
        };

        yield return new RewardItem(
            "Сбережения на крупную награду", "Копим на большой приз вместе.", "longterm", "Долгосрочные",
            300,
            Color.FromArgb("#7C3AED"),
            Color.FromArgb("#8B5CF6"),
            Color.FromArgb("#EDE9FE"),
            "gift.png")
        {
            IsFeatured = true,
            IsActive = false,
            Estimation = "Цель месяца",
            Popularity = "Стратегическая награда"
        };

        yield return new RewardItem(
            "Выбор семейного ужина", "Меню праздника выбирает ребёнок.", "family", "Семья",
            130,
            Color.FromArgb("#F97316"),
            Color.FromArgb("#F59E0B"),
            Color.FromArgb("#FEF3C7"),
            "heart.png")
        {
            Estimation = "~1 вечер",
            Popularity = "Создаёт традиции"
        };
    }
}

public class RewardItem : ObservableObject
{
    private string _title;
    private string? _description;
    private string _categoryKey;
    private string _categoryName;
    private int _points;
    private Color _accentGradientStart;
    private Color _accentGradientEnd;
    private Color _badgeBackground;
    private string _icon;
    private string? _estimation;
    private string? _popularity;
    private bool _isFeatured;
    private bool _isActive = true;

    public RewardItem(
        string title,
        string? description,
        string categoryKey,
        string categoryName,
        int points,
        Color accentStart,
        Color accentEnd,
        Color badgeBackground,
        string icon)
    {
        Id = Guid.NewGuid();
        _title = title;
        _description = description;
        _categoryKey = categoryKey;
        _categoryName = categoryName;
        _points = points;
        _accentGradientStart = accentStart;
        _accentGradientEnd = accentEnd;
        _badgeBackground = badgeBackground;
        _icon = icon;
    }

    public Guid Id { get; }

    public string Title
    {
        get => _title;
        set => SetProperty(ref _title, value);
    }

    public string? Description
    {
        get => _description;
        set => SetProperty(ref _description, value);
    }

    public string CategoryKey
    {
        get => _categoryKey;
        set => SetProperty(ref _categoryKey, value);
    }

    public string CategoryName
    {
        get => _categoryName;
        set => SetProperty(ref _categoryName, value);
    }

    public int Points
    {
        get => _points;
        set => SetProperty(ref _points, value);
    }

    public Color AccentGradientStart
    {
        get => _accentGradientStart;
        set => SetProperty(ref _accentGradientStart, value);
    }

    public Color AccentGradientEnd
    {
        get => _accentGradientEnd;
        set => SetProperty(ref _accentGradientEnd, value);
    }

    public Color BadgeBackground
    {
        get => _badgeBackground;
        set => SetProperty(ref _badgeBackground, value);
    }

    public string Icon
    {
        get => _icon;
        set => SetProperty(ref _icon, value);
    }

    public string? Estimation
    {
        get => _estimation;
        set => SetProperty(ref _estimation, value);
    }

    public string? Popularity
    {
        get => _popularity;
        set => SetProperty(ref _popularity, value);
    }

    public bool IsFeatured
    {
        get => _isFeatured;
        set => SetProperty(ref _isFeatured, value);
    }

    public bool IsActive
    {
        get => _isActive;
        set
        {
            if (SetProperty(ref _isActive, value))
            {
                OnPropertyChanged(nameof(ActivationActionLabel));
                OnPropertyChanged(nameof(ActivationStatusLabel));
            }
        }
    }

    public string ActivationActionLabel => IsActive ? "Деактивировать" : "Активировать";

    public string ActivationStatusLabel => IsActive ? "Активна" : "На паузе";
}

public class RewardCategory : ObservableObject
{
    private bool _isSelected;

    public RewardCategory(string key, string displayName, Color textColor, Color backgroundColor, Color? activeBackground = null)
    {
        Key = key;
        DisplayName = displayName;
        TextColor = textColor;
        BackgroundColor = backgroundColor;
        ActiveBackground = activeBackground ?? textColor.WithAlpha(0.18f);
    }

    public string Key { get; }

    public string DisplayName { get; }

    public Color TextColor { get; }

    public Color BackgroundColor { get; }

    public Color ActiveBackground { get; }

    public string? Icon { get; set; }

    public bool IsSelected
    {
        get => _isSelected;
        set => SetProperty(ref _isSelected, value);
    }
}

public class RewardEditorCategoryOption
{
    public RewardEditorCategoryOption(string key, string displayName, string icon, Color accentStart, Color accentEnd, Color badgeBackground)
    {
        Key = key;
        DisplayName = displayName;
        Icon = icon;
        AccentStart = accentStart;
        AccentEnd = accentEnd;
        BadgeBackground = badgeBackground;
    }

    public string Key { get; }

    public string DisplayName { get; }

    public string Icon { get; }

    public Color AccentStart { get; }

    public Color AccentEnd { get; }

    public Color BadgeBackground { get; }

    public override string ToString() => DisplayName;
}

public class RewardEditorState : ObservableObject
{
    private RewardItem? _targetReward;
    private string _title = string.Empty;
    private string? _description;
    private string _pointsInput = string.Empty;
    private string? _estimation;
    private string? _popularity;
    private bool _isFeatured;
    private bool _isActive = true;
    private RewardEditorCategoryOption? _selectedCategory;
    private bool _isNew = true;
    private string? _errorMessage;

    public RewardItem? TargetReward
    {
        get => _targetReward;
        private set
        {
            if (SetProperty(ref _targetReward, value))
            {
                OnPropertyChanged(nameof(HeaderTitle));
                OnPropertyChanged(nameof(SaveButtonText));
            }
        }
    }

    public string Title
    {
        get => _title;
        set
        {
            if (SetProperty(ref _title, value))
            {
                OnPropertyChanged(nameof(HeaderTitle));
            }
        }
    }

    public string? Description
    {
        get => _description;
        set => SetProperty(ref _description, value);
    }

    public string PointsInput
    {
        get => _pointsInput;
        set => SetProperty(ref _pointsInput, value);
    }

    public string? Estimation
    {
        get => _estimation;
        set => SetProperty(ref _estimation, value);
    }

    public string? Popularity
    {
        get => _popularity;
        set => SetProperty(ref _popularity, value);
    }

    public bool IsFeatured
    {
        get => _isFeatured;
        set => SetProperty(ref _isFeatured, value);
    }

    public bool IsActive
    {
        get => _isActive;
        set => SetProperty(ref _isActive, value);
    }

    public RewardEditorCategoryOption? SelectedCategory
    {
        get => _selectedCategory;
        set => SetProperty(ref _selectedCategory, value);
    }

    public bool IsNew
    {
        get => _isNew;
        private set
        {
            if (SetProperty(ref _isNew, value))
            {
                OnPropertyChanged(nameof(SaveButtonText));
            }
        }
    }

    public string? ErrorMessage
    {
        get => _errorMessage;
        private set
        {
            if (SetProperty(ref _errorMessage, value))
            {
                OnPropertyChanged(nameof(HasError));
            }
        }
    }

    public string HeaderTitle => TargetReward is null ? "Новая награда" : $"Редактирование: {Title}";

    public string SaveButtonText => IsNew ? "Создать" : "Сохранить";

    public bool HasError => !string.IsNullOrWhiteSpace(ErrorMessage);

    public void LoadForCreate(RewardEditorCategoryOption? defaultCategory)
    {
        ResetValidation();
        TargetReward = null;
        Title = string.Empty;
        Description = null;
        PointsInput = "100";
        Estimation = null;
        Popularity = null;
        IsFeatured = false;
        IsActive = true;
        SelectedCategory = defaultCategory;
        IsNew = true;
    }

    public void LoadFromReward(RewardItem reward, RewardEditorCategoryOption? categoryOption)
    {
        if (reward == null)
        {
            throw new ArgumentNullException(nameof(reward));
        }

        ResetValidation();
        TargetReward = reward;
        Title = reward.Title;
        Description = reward.Description;
        PointsInput = reward.Points.ToString(CultureInfo.InvariantCulture);
        Estimation = reward.Estimation;
        Popularity = reward.Popularity;
        IsFeatured = reward.IsFeatured;
        IsActive = reward.IsActive;
        SelectedCategory = categoryOption;
        IsNew = false;
    }

    public void ResetValidation()
    {
        ErrorMessage = null;
    }

    public void SetError(string message)
    {
        ErrorMessage = message;
    }

    public void ResetAfterSave()
    {
        TargetReward = null;
        ResetValidation();
    }
}

internal sealed record RewardStyling(string DisplayName, Color AccentStart, Color AccentEnd, Color BadgeBackground, string Icon);

