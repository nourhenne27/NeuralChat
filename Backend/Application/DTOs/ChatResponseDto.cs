namespace Application.DTOs;

public class ChatResponseDto
{
    // Réponse du modèle IA
    public string Message { get; set; } = string.Empty;

    // Sources utilisées (documents, chunks, etc.)
    public List<string> Sources { get; set; } = new();

    // Date de génération de la réponse
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}