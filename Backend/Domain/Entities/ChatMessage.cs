namespace Domain.Entities;

public class ChatMessage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SessionId { get; set; }
    public string Role { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? SourcesJson { get; set; }

    public ChatSession Session { get; set; } = null!;
    public ICollection<Feedback> Feedbacks { get; set; } = new List<Feedback>();
}