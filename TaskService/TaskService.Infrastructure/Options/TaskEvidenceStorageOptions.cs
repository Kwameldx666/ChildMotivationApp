namespace TaskService.Infrastructure.Options;

public class TaskEvidenceStorageOptions
{
    public const string SectionName = "TaskEvidenceStorage";

    public string RootPath { get; set; } = Path.Combine(AppContext.BaseDirectory, "evidence");
}
