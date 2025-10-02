namespace ChildMotivationApp
{
    public partial class App : Application
    {
        public App()
        {
            InitializeComponent();
        }

        protected override Window CreateWindow(IActivationState? activationState)
        {
            var shell = new AppShell();
            
            // Устанавливаем стартовую страницу
            MainThread.BeginInvokeOnMainThread(async () =>
            {
                await shell.GoToAsync("//welcome");
            });
            
            return new Window(shell);
        }
    }
}