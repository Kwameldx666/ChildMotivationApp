using System.Collections.ObjectModel;
using Microsoft.Maui.Controls;

namespace ChildMotivationApp.Pages.Child;

public partial class ChildRewardsPage : ContentPage
{
    public ObservableCollection<ChildReward> Rewards { get; } = new();

    public ChildRewardsPage()
    {
        InitializeComponent();
        BindingContext = this;

        Rewards.Add(new ChildReward("🎮", "15 минут приставки", "Выбираешь любимую игру и играешь сам!", 80));
        Rewards.Add(new ChildReward("🎨", "Творческий час", "Рисование, лепка или поделки по твоему выбору", 60));
        Rewards.Add(new ChildReward("🍕", "Мини-пицца", "Совместно готовим пиццу и выбираем начинку", 110));
        Rewards.Add(new ChildReward("🎢", "Настольная игра", "Выбираешь семейную игру на вечер", 70));
        Rewards.Add(new ChildReward("🎧", "Музыкальная дискотека", "15 минут танцев под твой плейлист", 50));
        Rewards.Add(new ChildReward("🎁", "Сюрприз от родителей", "Небольшой подарок или совместное занятие", 150));
    }

    public record ChildReward(string Emoji, string Title, string Description, int Points)
    {
        public string PointsText => $"{Points} очков";
    }
}
