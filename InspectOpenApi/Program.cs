using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

var methods = typeof(SwaggerGenOptions).GetMethods().ToList();
Console.WriteLine(typeof(SwaggerGeneratorOptions).FullName);
foreach (var prop in typeof(SwaggerGeneratorOptions).GetProperties())
{
    Console.WriteLine($"- {prop.Name}: {prop.PropertyType.FullName}");
}
