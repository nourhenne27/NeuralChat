namespace Domain.Interfaces;

public interface ILLMService
{
    Task<string> GenerateResponseAsync(
        string prompt,
        List<(string Role, string Content)>? conversationHistory = null);

    // Pour le streaming futur (optionnel pour l'instant)
    IAsyncEnumerable<string> GenerateResponseStreamAsync(
        string prompt,
        List<(string Role, string Content)>? conversationHistory = null);
}