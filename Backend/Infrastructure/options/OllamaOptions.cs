namespace Infrastructure.Options;

public class OllamaOptions
{
    public const string SectionName = "OllamaOptions";
    public string BaseUrl { get; set; } = "http://localhost:11434";
    public string EmbeddingModel { get; set; } = "nomic-embed-text";
    public string ChatModel { get; set; } = "llama3.2";  // ← manquait
}