using Domain.Interfaces;
using Infrastructure.Options;
using Microsoft.Extensions.Options;
using System.Net.Http.Json;

namespace Infrastructure.LLM;

public class LLMService : ILLMService
{
    private readonly HttpClient _http;
    private readonly OllamaOptions _options;

    public LLMService(HttpClient http, IOptions<OllamaOptions> options)
    {
        _http = http;
        _options = options.Value;
        _http.Timeout = TimeSpan.FromMinutes(4);
    }

    /// <summary>
    /// Version non-streaming (actuelle, bloquante)
    /// </summary>
    public async Task<string> GenerateResponseAsync(
        string prompt,
        List<(string Role, string Content)>? conversationHistory = null)
    {
        var messages = BuildMessages(prompt, conversationHistory);

        var url = $"{_options.BaseUrl}/api/chat";

        var requestBody = new
        {
            model = _options.ChatModel,
            stream = false,
            messages,
            temperature = 0.7,
            top_p = 0.9,
            num_predict = 2048
        };

        var response = await _http.PostAsJsonAsync(url, requestBody);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<OllamaChatResponse>();

        return result?.Message?.Content?.Trim()
            ?? "Désolé, je n'ai pas pu générer de réponse.";
    }

    /// <summary>
    /// Version Streaming - lit le NDJSON ligne par ligne
    /// </summary>
    public async IAsyncEnumerable<string> GenerateResponseStreamAsync(
        string prompt,
        List<(string Role, string Content)>? conversationHistory = null)
    {
        var messages = BuildMessages(prompt, conversationHistory);

        var url = $"{_options.BaseUrl}/api/chat";

        var requestBody = new
        {
            model = _options.ChatModel,
            stream = true,
            messages,
            temperature = 0.7,
            top_p = 0.9
        };

        var response = await _http.PostAsJsonAsync(url, requestBody);
        response.EnsureSuccessStatusCode();

        // Ollama stream renvoie du NDJSON (une ligne JSON par token)
        // ReadFromJsonAsAsyncEnumerable attend un JSON array -> erreur
        // Il faut lire ligne par ligne manuellement
        using var stream = await response.Content.ReadAsStreamAsync();
        using var reader = new System.IO.StreamReader(stream);

        while (!reader.EndOfStream)
        {
            var line = await reader.ReadLineAsync();
            if (string.IsNullOrWhiteSpace(line)) continue;

            var chunk = System.Text.Json.JsonSerializer.Deserialize<OllamaStreamResponse>(line,
                new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (!string.IsNullOrEmpty(chunk?.Message?.Content))
            {
                yield return chunk.Message.Content;
            }
        }
    }

    private List<object> BuildMessages(
        string prompt,
        List<(string Role, string Content)>? conversationHistory)
    {
        var systemPrompt = "You are a RAG assistant. " +
                           "Read every document excerpt carefully word by word. " +
                           "If the answer is in the excerpts, state it directly and concisely. " +
                           "NEVER say information is missing if it appears in the excerpts. " +
                           "NEVER add preamble, hedging, or unnecessary qualifications. " +
                           "Always answer in the same language as the question.";

        var messages = new List<object>
        {
            new { role = "system", content = systemPrompt }
        };

        if (conversationHistory != null && conversationHistory.Any())
        {
            var recent = conversationHistory
                .TakeLast(6)
                .Select(m => new { role = m.Role.ToLowerInvariant(), content = m.Content });

            messages.AddRange(recent);
        }

        messages.Add(new { role = "user", content = prompt });

        return messages;
    }
}

// === Classes de réponse Ollama ===
public class OllamaChatResponse
{
    public OllamaMessage? Message { get; set; }
}

public class OllamaStreamResponse
{
    public OllamaMessage? Message { get; set; }
    public bool Done { get; set; }
}

public class OllamaMessage
{
    public string Role { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
}