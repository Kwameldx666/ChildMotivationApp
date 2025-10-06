using Microsoft.Maui.Controls;

namespace ChildMotivationApp.Pages;

public partial class ParentStatsPage : ContentPage
{
    public ParentStatsPage()
    {
        InitializeComponent();
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();
        // В будущем здесь можно загружать данные статистики
        LoadStatistics();
    }

    private void LoadStatistics()
    {
        // TODO: Загрузка данных статистики из БД или API
        // Пока оставляем пустым, данные будут добавлены позже
    }
}
