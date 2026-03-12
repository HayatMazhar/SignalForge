using Azure;
using Azure.Search.Documents;
using Azure.Search.Documents.Indexes;
using Azure.Search.Documents.Indexes.Models;
using Azure.Search.Documents.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace SignalForge.Infrastructure.Services;

public sealed class AzureSearchService
{
    private readonly SearchClient? _searchClient;
    private readonly SearchIndexClient? _indexClient;
    private readonly ILogger<AzureSearchService> _logger;
    private const string IndexName = "market-knowledge";
    private bool _indexReady;

    public AzureSearchService(IConfiguration config, ILogger<AzureSearchService> logger)
    {
        _logger = logger;
        var endpoint = config["AzureSearch:Endpoint"];
        var key = config["AzureSearch:ApiKey"];
        if (!string.IsNullOrEmpty(endpoint) && !string.IsNullOrEmpty(key))
        {
            var cred = new AzureKeyCredential(key);
            _indexClient = new SearchIndexClient(new Uri(endpoint), cred);
            _searchClient = new SearchClient(new Uri(endpoint), IndexName, cred);
        }
    }

    public bool IsAvailable => _searchClient != null;

    public async Task EnsureIndexAsync(CancellationToken ct = default)
    {
        if (_indexClient == null || _indexReady) return;
        try
        {
            var fields = new FieldBuilder().Build(typeof(MarketDocument));
            var definition = new SearchIndex(IndexName, fields);
            await _indexClient.CreateOrUpdateIndexAsync(definition, cancellationToken: ct);
            _indexReady = true;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to create search index");
        }
    }

    public async Task IndexDocumentsAsync(IEnumerable<MarketDocument> documents, CancellationToken ct = default)
    {
        if (_searchClient == null) return;
        await EnsureIndexAsync(ct);
        try
        {
            var batch = IndexDocumentsBatch.Upload(documents.ToList());
            await _searchClient.IndexDocumentsAsync(batch, cancellationToken: ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to index documents");
        }
    }

    public async Task<List<MarketDocument>> SearchAsync(string query, int top = 5, CancellationToken ct = default)
    {
        if (_searchClient == null) return [];
        try
        {
            var options = new SearchOptions { Size = top };
            options.Select.Add("id");
            options.Select.Add("title");
            options.Select.Add("content");
            options.Select.Add("symbol");
            options.Select.Add("category");
            options.Select.Add("timestamp");

            var response = await _searchClient.SearchAsync<MarketDocument>(query, options, ct);
            var results = new List<MarketDocument>();
            await foreach (var result in response.Value.GetResultsAsync())
            {
                results.Add(result.Document);
            }
            return results;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Search query failed: {Query}", query);
            return [];
        }
    }
}

public class MarketDocument
{
    [Azure.Search.Documents.Indexes.SimpleField(IsKey = true)]
    public string Id { get; set; } = "";

    [Azure.Search.Documents.Indexes.SearchableField(AnalyzerName = "en.lucene")]
    public string Title { get; set; } = "";

    [Azure.Search.Documents.Indexes.SearchableField(AnalyzerName = "en.lucene")]
    public string Content { get; set; } = "";

    [Azure.Search.Documents.Indexes.SearchableField(IsFilterable = true)]
    public string Symbol { get; set; } = "";

    [Azure.Search.Documents.Indexes.SimpleField(IsFilterable = true)]
    public string Category { get; set; } = "";

    [Azure.Search.Documents.Indexes.SimpleField(IsSortable = true)]
    public DateTimeOffset Timestamp { get; set; } = DateTimeOffset.UtcNow;
}
