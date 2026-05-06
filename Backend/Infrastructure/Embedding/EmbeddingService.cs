using Domain.Interfaces;
using Infrastructure.Options;
using Microsoft.Extensions.Options;
using Pgvector;
using System.Net.Http.Json;

namespace Infrastructure.Embedding;

public class EmbeddingService : IEmbeddingService
{
    private readonly HttpClient _http;
    private readonly OllamaOptions _options;

    public EmbeddingService(HttpClient http, IOptions<OllamaOptions> options)
    {
        _http = http;
        _options = options.Value;
        _http.Timeout = TimeSpan.FromMinutes(10);
    }

    // ✅ Méthode SINGULAR — requise par IEmbeddingService (ligne 9)
    public async Task<Vector> GenerateEmbeddingAsync(string text)
    {
        var response = await _http.PostAsJsonAsync(
            $"{_options.BaseUrl}/api/embed",
            new { model = _options.EmbeddingModel, input = new[] { text } }
        );

        response.EnsureSuccessStatusCode();
        var result = await response.Content.ReadFromJsonAsync<OllamaEmbedResponse>();
        return new Vector(result!.Embeddings[0]);
    }

    // ✅ Méthode PLURAL avec vrai batch — un seul appel HTTP par groupe de 20
    public async Task<IReadOnlyList<Vector>> GenerateEmbeddingsAsync(IEnumerable<string> texts)
    {
        var textList = texts.ToList();
        if (!textList.Any()) return Array.Empty<Vector>();

        const int batchSize = 20;
        var results = new List<Vector>(textList.Count);

        for (int i = 0; i < textList.Count; i += batchSize)
        {
            var batch = textList.Skip(i).Take(batchSize).ToList();

            var response = await _http.PostAsJsonAsync(
                $"{_options.BaseUrl}/api/embed",
                new { model = _options.EmbeddingModel, input = batch } // ← tableau entier
            );

            response.EnsureSuccessStatusCode();
            var result = await response.Content.ReadFromJsonAsync<OllamaEmbedResponse>();

            foreach (var embedding in result!.Embeddings)
                results.Add(new Vector(embedding));
        }

        return results;
    }
}

public class OllamaEmbedResponse
{
    public float[][] Embeddings { get; set; } = [];
}