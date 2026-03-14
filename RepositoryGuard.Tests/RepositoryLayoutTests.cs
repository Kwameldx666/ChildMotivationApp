using System.Xml.Linq;

namespace RepositoryGuard.Tests;

public sealed class RepositoryLayoutTests
{
    private static readonly string RepoRoot = ResolveRepoRoot();

    private static string ResolveRepoRoot()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);

        while (dir is not null)
        {
            var composePath = Path.Combine(dir.FullName, "docker-compose.yml");
            if (File.Exists(composePath))
            {
                return dir.FullName;
            }

            dir = dir.Parent;
        }

        throw new InvalidOperationException("Unable to locate repository root.");
    }

    [Fact]
    public void RepositoryRoot_ShouldContainExpectedTopLevelProjects()
    {
        string[] expected =
        {
            "AuthService",
            "UserService",
            "TaskService",
            "ShopService",
            "NotificationService",
            "AiService",
            "GatewayService",
            "Frontend",
            "docker-compose.yml"
        };

        foreach (var path in expected)
        {
            var absolutePath = Path.Combine(RepoRoot, path);
            Assert.True(File.Exists(absolutePath) || Directory.Exists(absolutePath), $"Missing required path: {path}");
        }
    }

    [Fact]
    public void AllDotnetProjects_ShouldTargetNet10()
    {
        var csprojFiles = Directory.GetFiles(RepoRoot, "*.csproj", SearchOption.AllDirectories)
            .Where(path => !path.Contains(Path.DirectorySeparatorChar + "bin" + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
            .Where(path => !path.Contains(Path.DirectorySeparatorChar + "obj" + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
            .ToArray();

        Assert.NotEmpty(csprojFiles);

        foreach (var csproj in csprojFiles)
        {
            var doc = XDocument.Load(csproj);
            var targetFramework = doc.Descendants("TargetFramework").Select(x => x.Value).FirstOrDefault();
            Assert.Equal("net10.0", targetFramework);
        }
    }
}
