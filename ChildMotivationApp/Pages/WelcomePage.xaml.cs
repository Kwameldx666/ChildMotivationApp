using Microsoft.Maui.Graphics;
using Microsoft.Maui.Controls;

namespace ChildMotivationApp.Pages;

public partial class WelcomePage : ContentPage
{
    public WelcomePage()
    {
        InitializeComponent();
        SetupAnimations();
    }
    
    private void SetupAnimations()
    {
        // Найдем GraphicsView и установим Drawable для градиентного текста
        var gradientView = this.FindByName<GraphicsView>("GradientTitleView");
        if (gradientView != null)
        {
            gradientView.Drawable = new GradientTextDrawable();
        }

        // Добавляем обработчики для hover эффекта плиток
        var pointsTile = this.FindByName<Frame>("PointsTile");
        var rewardsTile = this.FindByName<Frame>("RewardsTile");
        var teamworkTile = this.FindByName<Frame>("TeamworkTile");

        AddTileAnimations(pointsTile);
        AddTileAnimations(rewardsTile);
        AddTileAnimations(teamworkTile);

        // Запускаем анимации появления элементов
        StartEntranceAnimations();
    }

    private void AddTileAnimations(Frame tile)
    {
        if (tile != null)
        {
            // Создаем TapGestureRecognizer для обработки касаний
            var tapGesture = new TapGestureRecognizer();
            tapGesture.Tapped += OnTileTapped;
            tile.GestureRecognizers.Add(tapGesture);

            // Для desktop платформ добавляем PointerGestureRecognizer
            #if WINDOWS || MACCATALYST
            var pointerGesture = new PointerGestureRecognizer();
            pointerGesture.PointerEntered += OnTilePointerEntered;
            pointerGesture.PointerExited += OnTilePointerExited;
            tile.GestureRecognizers.Add(pointerGesture);
            #endif
        }
    }

    private async void StartEntranceAnimations()
    {
        await Task.Delay(100); // Небольшая задержка для инициализации

        var mainCard = this.FindByName<Frame>("MainCard");
        var heroIcon = this.FindByName<Grid>("HeroIconContainer");
        var titleLabel = this.FindByName<Label>("WelcomeTitleLabel");
        var gradientTitle = this.FindByName<GraphicsView>("GradientTitleView");
        var subtitle = this.FindByName<StackLayout>("SubtitleContainer"); // Теперь ищем StackLayout вместо Border
        var featuresGrid = this.FindByName<Grid>("FeaturesGrid");
        var actionButton = this.FindByName<Button>("ActionButton");

        // Устанавливаем начальные значения для анимации
        if (mainCard != null)
        {
            mainCard.Opacity = 0;
            mainCard.TranslationY = 50;
        }

        var elements = new List<(VisualElement element, int delay)>
        {
            (heroIcon, 200),
            (titleLabel, 400),
            (gradientTitle, 600),
            (subtitle, 800),
            (featuresGrid, 1000),
            (actionButton, 1200)
        };

        // Устанавливаем начальные значения для всех элементов
        foreach (var (element, _) in elements)
        {
            if (element != null)
            {
                element.Opacity = 0;
                element.TranslationY = 20;
                element.Scale = 0.9; // Добавляем масштабирование для более эффектного появления
            }
        }

        // Анимация появления карточки
        if (mainCard != null)
        {
            var fadeTask = mainCard.FadeTo(1, 800, Easing.CubicOut);
            var translateTask = mainCard.TranslateTo(0, 0, 800, Easing.CubicOut);
            await Task.WhenAll(fadeTask, translateTask);
        }

        // Последовательные анимации элементов
        var animationTasks = elements
            .Where(x => x.element != null)
            .Select(x => AnimateElementEntrance(x.element, x.delay))
            .ToArray();

        await Task.WhenAll(animationTasks);

        // Запускаем анимацию покачивания картинки
        StartImageSwayAnimation();
        
        // Запускаем пульсацию градиентного текста
        StartGradientTextPulse();
    }

    private async Task AnimateElementEntrance(VisualElement element, int delay)
    {
        await Task.Delay(delay);
        
        var fadeTask = element.FadeTo(1, 600, Easing.CubicOut);
        var translateTask = element.TranslateTo(0, 0, 600, Easing.CubicOut);
        var scaleTask = element.ScaleTo(1.0, 600, Easing.CubicOut);
        
        await Task.WhenAll(fadeTask, translateTask, scaleTask);
    }
    
    private async void StartImageSwayAnimation()
    {
        var heroImage = this.FindByName<Image>("HeroImage");
        
        if (heroImage != null)
        {
            _ = Task.Run(async () =>
            {
                while (true)
                {
                    try
                    {
                        await MainThread.InvokeOnMainThreadAsync(async () =>
                        {
                            // Покачивание влево
                            await heroImage.RotateTo(-15, 1500, Easing.SinInOut);
                            // Покачивание вправо
                            await heroImage.RotateTo(15, 1500, Easing.SinInOut);
                            // Возврат в центр
                            await heroImage.RotateTo(0, 1500, Easing.SinInOut);
                        });
                        await Task.Delay(500); // Небольшая пауза между циклами
                    }
                    catch
                    {
                        break; // Выходим из цикла если элемент уничтожен
                    }
                }
            });
        }
    }
    
    private async void StartGradientTextPulse()
    {
        var gradientTitle = this.FindByName<GraphicsView>("GradientTitleView");
        
        if (gradientTitle != null)
        {
            _ = Task.Run(async () =>
            {
                await Task.Delay(2000); // Задержка перед началом пульсации
                
                while (true)
                {
                    try
                    {
                        await MainThread.InvokeOnMainThreadAsync(async () =>
                        {
                            // Плавная пульсация
                            await gradientTitle.ScaleTo(1.05, 2000, Easing.SinInOut);
                            await gradientTitle.ScaleTo(1.0, 2000, Easing.SinInOut);
                        });
                        await Task.Delay(1000); // Пауза между пульсациями
                    }
                    catch
                    {
                        break; // Выходим из цикла если элемент уничтожен
                    }
                }
            });
        }
    }
    
    private async void OnStartClicked(object sender, EventArgs e)
    {
        var button = sender as Button;
        
        // Button press animation
        if (button != null)
        {
            await button.ScaleTo(0.95, 100, Easing.CubicOut);
            await button.ScaleTo(1.0, 100, Easing.CubicOut);
        }
        
        // Navigate to Role Selection page
        await Shell.Current.GoToAsync("//roleselection");
    }

    private async void OnHeroIconTapped(object sender, EventArgs e)
    {
        var heroIcon = sender as Grid;
        if (heroIcon != null)
        {
            // Эффект пульсации при касании
            await heroIcon.ScaleTo(1.2, 100, Easing.CubicOut);
            await heroIcon.ScaleTo(1.0, 100, Easing.CubicOut);
        }
    }

    private async void OnTileTapped(object sender, EventArgs e)
    {
        var tile = sender as Frame;
        if (tile != null)
        {
            // Эффект "bounce" при касании
            await tile.ScaleTo(0.95, 100, Easing.CubicOut);
            await tile.ScaleTo(1.0, 100, Easing.CubicOut);
        }
    }

    #if WINDOWS || MACCATALYST
    private async void OnTilePointerEntered(object sender, PointerEventArgs e)
    {
        var tile = sender as Frame;
        if (tile != null)
        {
            // Плавное увеличение и поднятие
            var scaleTask = tile.ScaleTo(1.05, 200, Easing.CubicOut);
            var translateTask = tile.TranslateTo(0, -5, 200, Easing.CubicOut);
            await Task.WhenAll(scaleTask, translateTask);
        }
    }

    private async void OnTilePointerExited(object sender, PointerEventArgs e)
    {
        var tile = sender as Frame;
        if (tile != null)
        {
            // Плавное возвращение к нормальному состоянию
            var scaleTask = tile.ScaleTo(1.0, 200, Easing.CubicOut);
            var translateTask = tile.TranslateTo(0, 0, 200, Easing.CubicOut);
            await Task.WhenAll(scaleTask, translateTask);
        }
    }
    #endif
}

public class GradientTextDrawable : IDrawable
{
    public void Draw(ICanvas canvas, RectF dirtyRect)
    {
        string text = "Family Tasks";
        float fontSize = 28;
        
        float centerX = dirtyRect.Center.X;
        float centerY = dirtyRect.Center.Y;
        
        // Рисуем только основной градиентный текст без тени
        DrawGradientText(canvas, text, centerX, centerY, fontSize);
    }
    
    private void DrawGradientText(ICanvas canvas, string text, float centerX, float centerY, float fontSize)
    {
        var chars = text.ToCharArray();
        float[] charWidths = CalculateCharWidths(chars, fontSize);
        float totalWidth = charWidths.Sum();
        
        float startX = centerX - totalWidth / 2;
        float currentX = startX;
        
        // Улучшенное вертикальное позиционирование
        float adjustedY = centerY + fontSize * 0.1f;
        
        for (int i = 0; i < chars.Length; i++)
        {
            if (chars[i] == ' ')
            {
                currentX += charWidths[i];
                continue;
            }
            
            // Позиция в градиенте с более плавным переходом
            float gradientPosition = (float)i / Math.Max(1, chars.Length - 1);
            
            // Более яркие и красивые цвета градиента
            var color = InterpolateColor(
                Color.FromArgb("#6366F1"), // Яркий индиго
                Color.FromArgb("#EC4899"), // Яркий розовый
                Color.FromArgb("#8B5CF6"), // Фиолетовый (средний цвет)
                gradientPosition
            );
            
            canvas.FontSize = fontSize;
            canvas.FontColor = color;
            
            string letter = chars[i].ToString();
            canvas.DrawString(letter, currentX + charWidths[i] / 2, adjustedY, HorizontalAlignment.Center);
            
            currentX += charWidths[i];
        }
    }
    
    private float[] CalculateCharWidths(char[] chars, float fontSize)
    {
        float[] charWidths = new float[chars.Length];
        
        for (int i = 0; i < chars.Length; i++)
        {
            string letter = chars[i].ToString();
            if (letter == " ")
            {
                charWidths[i] = fontSize * 0.3f;
            }
            else
            {
                charWidths[i] = letter switch
                {
                    "i" or "l" or "I" => fontSize * 0.35f,
                    "f" or "t" or "r" => fontSize * 0.45f,
                    "m" or "w" or "M" or "W" => fontSize * 0.75f,
                    _ => fontSize * 0.6f
                };
            }
        }
        
        return charWidths;
    }
    
    private Color InterpolateColor(Color start, Color end, Color middle, float t)
    {
        if (t <= 0.5f)
        {
            float localT = t * 2;
            return InterpolateColor(start, middle, localT);
        }
        else
        {
            float localT = (t - 0.5f) * 2;
            return InterpolateColor(middle, end, localT);
        }
    }
    
    private Color InterpolateColor(Color start, Color end, float t)
    {
        t = Math.Clamp(t, 0f, 1f);
        
        float r = start.Red + (end.Red - start.Red) * t;
        float g = start.Green + (end.Green - start.Green) * t;
        float b = start.Blue + (end.Blue - start.Blue) * t;
        float a = start.Alpha + (end.Alpha - start.Alpha) * t;
        
        return new Color(r, g, b, a);
    }
}