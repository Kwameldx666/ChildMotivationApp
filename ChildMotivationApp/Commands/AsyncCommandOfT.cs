using System;
using System.Threading.Tasks;
using System.Windows.Input;
using Microsoft.Maui.ApplicationModel;

namespace ChildMotivationApp.Commands;

public sealed class AsyncCommand<T> : ICommand
{
    private readonly Func<T?, Task> _execute;
    private readonly Func<T?, bool>? _canExecute;
    private bool _isExecuting;

    public AsyncCommand(Func<T?, Task> execute, Func<T?, bool>? canExecute = null)
    {
        _execute = execute ?? throw new ArgumentNullException(nameof(execute));
        _canExecute = canExecute;
    }

    public event EventHandler? CanExecuteChanged;

    public bool CanExecute(object? parameter)
    {
        if (_isExecuting)
        {
            return false;
        }

        var typedParameter = ConvertParameter(parameter);
        return _canExecute?.Invoke(typedParameter) ?? true;
    }

    public async void Execute(object? parameter)
    {
        if (!CanExecute(parameter))
        {
            return;
        }

        try
        {
            _isExecuting = true;
            RaiseCanExecuteChanged();
            var typedParameter = ConvertParameter(parameter);
            await _execute(typedParameter).ConfigureAwait(false);
        }
        finally
        {
            _isExecuting = false;
            RaiseCanExecuteChanged();
        }
    }

    private static T? ConvertParameter(object? parameter)
    {
        if (parameter is T typed)
        {
            return typed;
        }

        if (parameter is null)
        {
            return default;
        }

        return (T?)parameter;
    }

    public void RaiseCanExecuteChanged()
    {
        MainThread.BeginInvokeOnMainThread(() => CanExecuteChanged?.Invoke(this, EventArgs.Empty));
    }
}
