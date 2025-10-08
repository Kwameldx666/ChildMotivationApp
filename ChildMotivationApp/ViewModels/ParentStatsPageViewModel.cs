using System.Collections.ObjectModel;
using System.Linq;
using System.Threading.Tasks;
using System.Windows.Input;
using ChildMotivationApp.Commands;
using ChildMotivationApp.Services;

namespace ChildMotivationApp.ViewModels;

public sealed class ParentStatsPageViewModel : ViewModelBase
{
    private readonly AsyncCommand<string> _changePeriodCommand;
    private string _selectedPeriod;
    private int _totalTasksToday;
    private double _completionRate;
    private int _totalPointsEarned;
    private int _activeChildrenCount;

    public ParentStatsPageViewModel(
        INavigationService navigationService,
        IDialogService dialogService)
        : base(navigationService, dialogService)
    {
        Periods = new ObservableCollection<string>(new[] { "Неделя", "Месяц", "Год" });
        DailyActivity = new ObservableCollection<DailyActivityPoint>();
        _changePeriodCommand = new AsyncCommand<string>(OnChangePeriodAsync);

        _selectedPeriod = Periods.First();
        LoadSampleData();
        RaiseSummaryProperties();
    }

    public ObservableCollection<string> Periods { get; }

    public ObservableCollection<DailyActivityPoint> DailyActivity { get; }

    public string SelectedPeriod
    {
        get => _selectedPeriod;
        set
        {
            if (SetProperty(ref _selectedPeriod, value))
            {
                _changePeriodCommand.Execute(value);
                OnPropertyChanged(nameof(IsWeekSelected));
                OnPropertyChanged(nameof(IsMonthSelected));
                OnPropertyChanged(nameof(IsYearSelected));
            }
        }
    }

    public bool IsWeekSelected => SelectedPeriod == "Неделя";

    public bool IsMonthSelected => SelectedPeriod == "Месяц";

    public bool IsYearSelected => SelectedPeriod == "Год";

    public string TotalTasksTodayDisplay => _totalTasksToday.ToString();

    public string CompletionRateDisplay => $"{_completionRate:P0}";

    public string TotalPointsEarnedDisplay => _totalPointsEarned.ToString();

    public string ActiveChildrenDisplay => _activeChildrenCount.ToString();

    public ICommand ChangePeriodCommand => _changePeriodCommand;

    public override Task OnAppearingAsync()
    {
        // Hook for real data loading later on.
        return Task.CompletedTask;
    }

    private Task OnChangePeriodAsync(string? period)
    {
        // Placeholder logic. When connected to real backend, adjust values per period.
        if (string.IsNullOrWhiteSpace(period))
        {
            return Task.CompletedTask;
        }

        LoadSampleData(period);
        RaiseSummaryProperties();
        return Task.CompletedTask;
    }

    private void LoadSampleData(string? period = null)
    {
        var baseMultiplier = period switch
        {
            "Месяц" => 4,
            "Год" => 12,
            _ => 1
        };

        _totalTasksToday = 12 * baseMultiplier;
        _completionRate = 0.82;
        _totalPointsEarned = 420 * baseMultiplier;
        _activeChildrenCount = 2;

        DailyActivity.Clear();
        var reference = new[]
        {
            new DailyActivityPoint("Пн", 15 * baseMultiplier, 200, false),
            new DailyActivityPoint("Вт", 16 * baseMultiplier, 160, false),
            new DailyActivityPoint("Ср", 17 * baseMultiplier, 180, false),
            new DailyActivityPoint("Чт", 18 * baseMultiplier, 220, true),
            new DailyActivityPoint("Пт", 19 * baseMultiplier, 140, false),
            new DailyActivityPoint("Сб", 20 * baseMultiplier, 190, true),
            new DailyActivityPoint("Вс", 12 * baseMultiplier, 100, false)
        };

        foreach (var point in reference)
        {
            DailyActivity.Add(point);
        }
    }

    private void RaiseSummaryProperties()
    {
        OnPropertyChanged(nameof(TotalTasksTodayDisplay));
        OnPropertyChanged(nameof(CompletionRateDisplay));
        OnPropertyChanged(nameof(TotalPointsEarnedDisplay));
        OnPropertyChanged(nameof(ActiveChildrenDisplay));
    }
}

public sealed record DailyActivityPoint(string DayLabel, int TasksCompleted, double ColumnHeight, bool IsHighlighted);
