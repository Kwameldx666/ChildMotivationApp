namespace Gateway.Exceptions;

public abstract class ApiExceptions : Exception
{
    protected ApiExceptions(string message) : base(message)
    {
    }
}