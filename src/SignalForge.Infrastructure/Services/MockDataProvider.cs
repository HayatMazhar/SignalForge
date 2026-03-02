using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace SignalForge.Infrastructure.Services;

public class MockDataProvider
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public static T? LoadJson<T>(string fileName, ILogger logger)
    {
        try
        {
            var path = Path.Combine(AppContext.BaseDirectory, "MockData", fileName);
            if (!File.Exists(path))
            {
                logger.LogWarning("Mock data file not found: {Path}", path);
                return default;
            }

            var json = File.ReadAllText(path);
            return JsonSerializer.Deserialize<T>(json, JsonOptions);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to load mock data from {FileName}", fileName);
            return default;
        }
    }
}
