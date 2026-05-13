using Domain.Interfaces;
using Microsoft.Extensions.Options;
using Domain.Entities;
using Application.DTOs;
using System.Text.Json;
using System.Text;

namespace Application.Services;

public class RAGService
{
    private readonly IEmbeddingService _embeddingService;
    private readonly IVectorStore _vectorStore;
    private readonly ILLMService _llmService;
    private readonly PromptBuilderService _promptBuilder;
    private readonly IChatSessionRepository _chatSessionRepository;
    private readonly ChunkingOptions _chunkingOptions;

    private static readonly JsonSerializerOptions _camelCase = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
    };

    private static readonly string[] _noAnswerPhrases =
    [
        "could not find", "cannot find", "not find", "no information",
        "not found", "pas trouvé", "aucune information", "je n'ai pas",
        "n'est pas mentionné", "not mentioned", "not available",
        "not provided", "not contain", "does not contain",
        "ne contient pas", "not in the provided", "not in the document"
    ];

    public RAGService(
        IEmbeddingService embeddingService,
        IVectorStore vectorStore,
        ILLMService llmService,
        PromptBuilderService promptBuilder,
        IChatSessionRepository chatSessionRepository,
        IOptions<ChunkingOptions> chunkingOptions)
    {
        _embeddingService = embeddingService;
        _vectorStore = vectorStore;
        _llmService = llmService;
        _promptBuilder = promptBuilder;
        _chatSessionRepository = chatSessionRepository;
        _chunkingOptions = chunkingOptions.Value;
    }

    public async Task<(string Response, List<SourceDto> Sources)> GetResponseAsync(
        string userQuestion, Guid sessionId)
    {
        var questionEmbedding = await _embeddingService.GenerateEmbeddingAsync(userQuestion);
        var retrieved = await _vectorStore.SearchAsync(
            questionEmbedding, 12, _chunkingOptions.SimilarityThreshold);

        if (!retrieved.Any())
            return ("Je n'ai pas trouvé d'information pertinente.", new List<SourceDto>());

        var finalResults = retrieved.Take(_chunkingOptions.TopK).ToList();
        var finalChunks = finalResults.Select(r => r.Chunk).ToList();

        var session = await _chatSessionRepository.GetByIdAsync(sessionId);
        var history = session?.Messages
            .OrderBy(m => m.CreatedAt)
            .Select(m => (Role: m.Role, Content: m.Content))
            .ToList() ?? new List<(string, string)>();

        var prompt = _promptBuilder.BuildPrompt(userQuestion, finalChunks);
        var response = await _llmService.GenerateResponseAsync(prompt, history);

        var sources = finalResults
            .Where(r => r.Chunk.Document != null)
            .GroupBy(r => r.Chunk.Document.Name)
            .Select(g =>
            {
                var best = g.OrderByDescending(r => r.Score).First();
                var excerpt = best.Chunk.Content.Length > 150
                    ? best.Chunk.Content[..150] + "..."
                    : best.Chunk.Content;
                return new SourceDto
                {
                    DocumentTitle = g.Key ?? "Document inconnu",
                    Excerpt = excerpt,
                    Score = Math.Round(best.Score, 4)
                };
            })
            .OrderByDescending(s => s.Score)
            .ToList();

        return (response, sources);
    }

    public async IAsyncEnumerable<string> GetResponseStreamAsync(
        string userQuestion, Guid sessionId)
    {
        var questionEmbedding = await _embeddingService.GenerateEmbeddingAsync(userQuestion);
        var retrieved = await _vectorStore.SearchAsync(
            questionEmbedding, 12, _chunkingOptions.SimilarityThreshold);

        if (!retrieved.Any())
        {
            yield return "Je n'ai pas trouvé d'information pertinente dans les documents disponibles.";
            yield return "[SOURCES_DATA][]";
            yield break;
        }

        var finalResults = retrieved.Take(_chunkingOptions.TopK).ToList();
        var finalChunks = finalResults.Select(r => r.Chunk).ToList();

        var session = await _chatSessionRepository.GetByIdAsync(sessionId);
        var history = session?.Messages
            .OrderBy(m => m.CreatedAt)
            .Select(m => (Role: m.Role, Content: m.Content))
            .ToList() ?? new List<(string, string)>();

        var prompt = _promptBuilder.BuildPrompt(userQuestion, finalChunks);
        var fullResponse = new StringBuilder();

        await foreach (var token in _llmService.GenerateResponseStreamAsync(prompt, history))
        {
            fullResponse.Append(token);
            yield return token;
        }

        var responseText = fullResponse.ToString().ToLowerInvariant();
        bool llmDidNotFind = _noAnswerPhrases.Any(p =>
            responseText.Contains(p.ToLowerInvariant()));

        if (llmDidNotFind)
        {
            yield return "[SOURCES_DATA][]";
            yield break;
        }

        var pertinentResults = finalResults
            .Where(r => r.Chunk.Document != null && r.Score >= _chunkingOptions.SimilarityThreshold)
            .OrderByDescending(r => r.Score)
            .ToList();

        // ✅ Sources affichage Angular
        var sourcesPayload = pertinentResults
            .GroupBy(r => r.Chunk.Document.Name)
            .Select(g =>
            {
                var best = g.OrderByDescending(r => r.Score).First();
                var excerpt = best.Chunk.Content.Length > 150
                    ? best.Chunk.Content[..150] + "..."
                    : best.Chunk.Content;
                return new SourceDto
                {
                    DocumentTitle = g.Key ?? "Document inconnu",
                    Excerpt = excerpt,
                    Score = Math.Round(best.Score, 4)
                };
            })
            .ToList();

        // ✅ ChunkIds pour RLHF (RecordPositiveFeedbackAsync)
        var chunkIds = pertinentResults.Select(r => r.Chunk.Id).ToList();

        yield return $"[SOURCES_DATA]{JsonSerializer.Serialize(sourcesPayload, _camelCase)}";
        yield return $"[CHUNK_IDS]{JsonSerializer.Serialize(chunkIds)}";
    }
}