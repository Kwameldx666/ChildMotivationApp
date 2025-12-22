using System.Linq;
using System.Reflection;

var mode = args.FirstOrDefault() ?? "openapi";
var filter = args.Length > 1 ? args[1] : null;

if (mode.Equals("openapi", StringComparison.OrdinalIgnoreCase))
{
	InspectAssembly(
		@"C:\Users\Kwameldx666\.nuget\packages\microsoft.openapi\2.3.0\lib\netstandard2.0\Microsoft.OpenApi.dll",
		type => string.IsNullOrEmpty(filter)
			? type.Namespace == "Microsoft.OpenApi" && type.Name.StartsWith("OpenApiSecurity")
			: string.Equals(type.FullName, filter, StringComparison.Ordinal));
}
else if (mode.Equals("swash", StringComparison.OrdinalIgnoreCase))
{
	InspectAssembly(
		@"C:\Users\Kwameldx666\.nuget\packages\swashbuckle.aspnetcore.swaggergen\10.1.0\lib\net8.0\Swashbuckle.AspNetCore.SwaggerGen.dll",
		type => string.IsNullOrEmpty(filter)
			? type.Namespace?.StartsWith("Swashbuckle.AspNetCore") == true && type.Name.Contains("Security")
			: string.Equals(type.FullName, filter, StringComparison.Ordinal));
}

static void InspectAssembly(string path, Func<Type, bool> predicate)
{
	Assembly assembly;
	try
	{
		assembly = Assembly.LoadFrom(path);
	}
	catch (Exception ex)
	{
		Console.WriteLine($"Failed to load assembly: {ex.Message}");
		return;
	}

	Console.WriteLine($"Loaded: {assembly.FullName}");

	Type[] types;
	try
	{
		types = assembly.GetTypes();
	}
	catch (ReflectionTypeLoadException ex)
	{
		types = ex.Types.Where(t => t != null).ToArray()!;
		Console.WriteLine("Encountered load exceptions:");
		foreach (var loaderEx in ex.LoaderExceptions)
		{
			Console.WriteLine($"  {loaderEx?.Message}");
		}
	}

	foreach (var type in types.Where(predicate))
	{
		Console.WriteLine(type.FullName);
		foreach (var ctor in type.GetConstructors(BindingFlags.Public | BindingFlags.Instance))
		{
			var parameters = string.Join(", ", ctor.GetParameters().Select(p => $"{p.ParameterType.Name} {p.Name}"));
			Console.WriteLine($"  Ctor: {ctor.Name}({parameters})");
		}

		foreach (var method in type.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.Static))
		{
			var parameters = string.Join(", ", method.GetParameters()
				.Select(p => $"{p.ParameterType.Name} {p.Name}"));
			Console.WriteLine($"  Method: {method.Name}({parameters})");
		}

		foreach (var property in type.GetProperties(BindingFlags.Public | BindingFlags.Instance | BindingFlags.Static))
		{
			Console.WriteLine($"  Property: {property.PropertyType.Name} {property.Name}");
		}
	}
}
