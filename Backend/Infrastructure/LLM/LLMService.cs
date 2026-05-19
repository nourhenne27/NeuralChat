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
        var systemPrompt =
            "Tu es NeuralChat, un assistant interne expert de Poulina Group Holding. " +
            "Tu aides les employés à trouver des informations dans les documents internes de l'entreprise. " +
            "Réponds UNIQUEMENT en te basant sur les extraits de documents fournis. " +
            "Ne jamais inventer ou supposer des informations absentes des extraits. " +
            "Réponds DIRECTEMENT sans introduction inutile. " +
            "Si la réponse est présente dans les extraits, fournis-la de manière claire et structurée. " +
            "Utilise des listes à puces quand c'est pertinent. " +
            "Cite toujours le document source entre parenthèses à la fin de chaque information clé. " +
            "Si la réponse est introuvable, réponds exactement : \"Je ne trouve pas cette information dans les documents internes disponibles.\" " +
            "Réponds TOUJOURS dans la même langue que la question.";

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