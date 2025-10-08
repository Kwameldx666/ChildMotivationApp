using System.Collections.ObjectModel;
using Microsoft.Maui.Controls;

namespace ChildMotivationApp.Pages.Child;

public partial class ChildProgressPage : ContentPage
{
    public ObservableCollection<WeeklyProgressItem> WeeklyProgress { get; } = new();

    public ChildProgressPage()
    {
        InitializeComponent();
        BindingContext = this;

        WeeklyProgress.Add(new WeeklyProgressItem("Понедельник", 0.8, "3 задания выполнено"));
        WeeklyProgress.Add(new WeeklyProgressItem("Вторник", 0.6, "Собраны игрушки и сделано уроки"));
        WeeklyProgress.Add(new WeeklyProgressItem("Среда", 0.9, "Почти идеальный день!"));
        WeeklyProgress.Add(new WeeklyProgressItem("Четверг", 0.5, "Осталось одно дело"));
        WeeklyProgress.Add(new WeeklyProgressItem("Пятница", 1.0, "Все задания готовы!"));
    }

    public record WeeklyProgressItem(string Day, double Completion, string Summary);
}
