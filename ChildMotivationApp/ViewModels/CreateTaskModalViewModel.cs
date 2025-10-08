using System;
using System.Collections.ObjectModel;
using System.Threading.Tasks;
using System.Windows.Input;
using ChildMotivationApp.Commands;
using ChildMotivationApp.Services;

namespace ChildMotivationApp.ViewModels;

public sealed class CreateTaskModalViewModel : ViewModelBase
{
    private readonly AsyncCommand _createTaskCommand;
    private readonly AsyncCommand _cancelCommand;
    private readonly AsyncCommand<string> _selectVerificationMethodCommand;
    private string _taskName = string.Empty;
    private string? _description;
    private string _selectedCategory;
    private string _selectedPriority;
    private string? _pointsText = "10";
    private string? _difficultyText = "3";
    private string? _durationText = "30";
    private DateTime _dueDate;
    private string? _selectedChild;
    private bool _isChildSelectionErrorVisible;
    private string _selectedVerificationMethod;

    public CreateTaskModalViewModel(
        INavigationService navigationService,
        IDialogService dialogService)
        : base(navigationService, dialogService)
    {
        CategoryOptions = new ObservableCollection<string>(new[]
        {
            "🧹 Уборка",
            "📚 Учёба",
            "🏃 Спорт",
            "🎨 Творчество",
            "🍽️ Помощь по дому"
        });

        PriorityOptions = new ObservableCollection<string>(new[]
        {
            "🔴 Высокий",
            "⚡ Средний",
            "🟢 Низкий"
        });

        ChildOptions = new ObservableCollection<string>(new[]
        {
            "👧 Маша (8 лет)",
            "👦 Петя (10 лет)"
        });

        _selectedCategory = CategoryOptions[0];
        _selectedPriority = PriorityOptions.Count > 1 ? PriorityOptions[1] : PriorityOptions[0];
        _selectedVerificationMethod = "photo";
        _dueDate = DateTime.Today.AddDays(1);

        _createTaskCommand = new AsyncCommand(OnCreateTaskAsync, () => !IsBusy);
        _cancelCommand = new AsyncCommand(OnCancelAsync, () => !IsBusy);
        _selectVerificationMethodCommand = new AsyncCommand<string>(OnSelectVerificationMethodAsync);
    }

    public event EventHandler? RequestClose;

    public ObservableCollection<string> CategoryOptions { get; }

    public ObservableCollection<string> PriorityOptions { get; }

    public ObservableCollection<string> ChildOptions { get; }

    public string TaskName
    {
        get => _taskName;
        set => SetProperty(ref _taskName, value);
    }

    public string? Description
    {
        get => _description;
        set => SetProperty(ref _description, value);
    }

    public string SelectedCategory
    {
        get => _selectedCategory;
        set => SetProperty(ref _selectedCategory, value);
    }

    public string SelectedPriority
    {
        get => _selectedPriority;
        set => SetProperty(ref _selectedPriority, value);
    }

    public string? PointsText
    {
        get => _pointsText;
        set => SetProperty(ref _pointsText, value);
    }

    public string? DifficultyText
    {
        get => _difficultyText;
        set => SetProperty(ref _difficultyText, value);
    }

    public string? DurationText
    {
        get => _durationText;
        set => SetProperty(ref _durationText, value);
    }

    public DateTime DueDate
    {
        get => _dueDate;
        set => SetProperty(ref _dueDate, value);
    }

    public string? SelectedChild
    {
        get => _selectedChild;
        set
        {
            if (SetProperty(ref _selectedChild, value))
            {
                if (!string.IsNullOrWhiteSpace(value))
                {
                    IsChildSelectionErrorVisible = false;
                }
            }
        }
    }

    public bool IsChildSelectionErrorVisible
    {
        get => _isChildSelectionErrorVisible;
        private set => SetProperty(ref _isChildSelectionErrorVisible, value);
    }

    public string SelectedVerificationMethod
    {
        get => _selectedVerificationMethod;
        private set => SetProperty(ref _selectedVerificationMethod, value);
    }

    public ICommand CreateTaskCommand => _createTaskCommand;

    public ICommand CancelCommand => _cancelCommand;

    public ICommand SelectVerificationMethodCommand => _selectVerificationMethodCommand;

    private async Task OnCreateTaskAsync()
    {
        if (IsBusy)
        {
            return;
        }

        if (string.IsNullOrWhiteSpace(TaskName))
        {
            await DialogService.ShowAlertAsync("Ошибка", "Пожалуйста, введи название задачи.", "OK");
            return;
        }

        if (string.IsNullOrWhiteSpace(SelectedChild))
        {
            IsChildSelectionErrorVisible = true;
            await DialogService.ShowAlertAsync("Ошибка", "Пожалуйста, выбери ребёнка для задачи.", "OK");
            return;
        }

        if (!TryParsePositiveInt(PointsText, out var points))
        {
            await DialogService.ShowAlertAsync("Ошибка", "Укажи корректное количество очков.", "OK");
            return;
        }

        if (!TryParsePositiveInt(DifficultyText, out var difficulty))
        {
            await DialogService.ShowAlertAsync("Ошибка", "Укажи корректную сложность.", "OK");
            return;
        }

        if (!TryParsePositiveInt(DurationText, out var duration))
        {
            await DialogService.ShowAlertAsync("Ошибка", "Укажи корректное время выполнения в минутах.", "OK");
            return;
        }

        IsBusy = true;
        _createTaskCommand.RaiseCanExecuteChanged();
        _cancelCommand.RaiseCanExecuteChanged();

        try
        {
            await DialogService.ShowAlertAsync(
                "Готово!",
                $"Задача \"{TaskName.Trim()}\" создана для {SelectedChild}.",
                "Отлично");

            ResetForm();
            RequestClose?.Invoke(this, EventArgs.Empty);
        }
        finally
        {
            IsBusy = false;
            _createTaskCommand.RaiseCanExecuteChanged();
            _cancelCommand.RaiseCanExecuteChanged();
        }
    }

    private Task OnCancelAsync()
    {
        ResetForm();
        RequestClose?.Invoke(this, EventArgs.Empty);
        return Task.CompletedTask;
    }

    private Task OnSelectVerificationMethodAsync(string? method)
    {
        if (!string.IsNullOrWhiteSpace(method))
        {
            SelectedVerificationMethod = method;
        }

        return Task.CompletedTask;
    }

    private static bool TryParsePositiveInt(string? input, out int value)
    {
        if (int.TryParse(input, out value) && value > 0)
        {
            return true;
        }

        value = 0;
        return false;
    }

    private void ResetForm()
    {
        TaskName = string.Empty;
        Description = string.Empty;
        PointsText = "10";
        DifficultyText = "3";
        DurationText = "30";
        DueDate = DateTime.Today.AddDays(1);
        SelectedCategory = CategoryOptions[0];
        SelectedPriority = PriorityOptions.Count > 1 ? PriorityOptions[1] : PriorityOptions[0];
        SelectedChild = null;
        SelectedVerificationMethod = "photo";
        IsChildSelectionErrorVisible = false;
    }
}
