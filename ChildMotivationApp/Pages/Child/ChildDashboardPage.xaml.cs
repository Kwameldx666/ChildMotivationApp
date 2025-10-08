using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Linq;
using Microsoft.Maui.Controls;

namespace ChildMotivationApp.Pages.Child;

public partial class ChildDashboardPage : ContentPage
{
    public ObservableCollection<ChildTaskItem> TodayTasks { get; } = new();
    public ObservableCollection<RewardHighlight> RewardHighlights { get; } = new();

    public ChildDashboardPage()
    {
        InitializeComponent();
        BindingContext = this;

        TodayTasks.Add(new ChildTaskItem("Утренняя зарядка", 20));
        TodayTasks.Add(new ChildTaskItem("Собрать игрушки", 15));
        TodayTasks.Add(new ChildTaskItem("Прочитать книгу", 25));

        RewardHighlights.Add(new RewardHighlight("🎮", "15 минут приставки", 80));
        RewardHighlights.Add(new RewardHighlight("🍦", "Поход за мороженым", 90));
        RewardHighlights.Add(new RewardHighlight("🎉", "Выбор семейной игры", 120));

        UpdateProgress();
    }

    private void OnTaskCompletionChanged(object sender, CheckedChangedEventArgs e)
    {
        if (sender is CheckBox checkBox && checkBox.BindingContext is ChildTaskItem task)
        {
            task.IsCompleted = e.Value;
            UpdateProgress();
        }
    }

    private void UpdateProgress()
    {
        if (TodayTasks.Count == 0)
        {
            TasksProgressBar.Progress = 0;
            CompletedCounter.Text = "0 из 0 выполнено";
            DailyMessage.Text = "Добавь своё первое задание!";
            return;
        }

        var completed = TodayTasks.Count(t => t.IsCompleted);
        TasksProgressBar.Progress = completed / (double)TodayTasks.Count;
        CompletedCounter.Text = $"{completed} из {TodayTasks.Count} выполнено";

        if (completed == TodayTasks.Count)
        {
            DailyMessage.Text = "Ура! Все задания выполнены, ты супергерой!";
        }
        else if (completed > 0)
        {
            DailyMessage.Text = "Отлично! Продолжай в том же духе.";
        }
        else
        {
            DailyMessage.Text = "Начни с любого задания, и очки станут твоими!";
        }
    }

    public class ChildTaskItem : INotifyPropertyChanged
    {
        private bool _isCompleted;

        public string Title { get; }
        public int Points { get; }

        public string PointsText => $"+{Points} очков";

        public bool IsCompleted
        {
            get => _isCompleted;
            set
            {
                if (_isCompleted != value)
                {
                    _isCompleted = value;
                    PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(nameof(IsCompleted)));
                }
            }
        }

        public ChildTaskItem(string title, int points)
        {
            Title = title;
            Points = points;
        }

        public event PropertyChangedEventHandler? PropertyChanged;
    }

    public record RewardHighlight(string Emoji, string Title, int Points)
    {
        public string PointsText => $"{Points} очков";
    }
}
