using System;
using System.Collections.ObjectModel;
using Microsoft.Maui.Controls;

namespace ChildMotivationApp.Pages.Child;

public partial class ChildProfilePage : ContentPage
{
    public ObservableCollection<ChildBadge> Badges { get; } = new();

    public ChildProfilePage()
    {
        InitializeComponent();
        BindingContext = this;

        Badges.Add(new ChildBadge("💎", "Чистюля", "Содержит комнату в порядке всю неделю"));
        Badges.Add(new ChildBadge("📚", "Книжный герой", "Прочитала 5 новых рассказов"));
        Badges.Add(new ChildBadge("🌟", "Помощница", "Порадовала семью добрыми делами"));
    }

    private async void OnStartIdeaClicked(object sender, EventArgs e)
    {
        await DisplayAlert("Ура!", "Расскажи родителям, и они помогут начать эту идею.", "Хорошо");
    }

    private async void OnChangeAvatarClicked(object sender, EventArgs e)
    {
        await DisplayAlert("Скоро", "Скоро появится возможность выбрать новый аватар!", "Жду");
    }

    private async void OnContactParentsClicked(object sender, EventArgs e)
    {
        await DisplayAlert("Сообщение отправлено", "Родители узнают, что тебе нужна помощь.", "Спасибо");
    }

    public record ChildBadge(string Emoji, string Title, string Description);
}
