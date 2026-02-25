namespace TaskService.Application.Common.Exceptions;

public class NotFoundException : Exception
{
    public NotFoundException(string name, object key)
        : base($"Entity '{name}' ({key}) was not found.")
    {
        EntityName = name;
        Key = key;
    }

    public string EntityName { get; }
    public object Key { get; }
}
