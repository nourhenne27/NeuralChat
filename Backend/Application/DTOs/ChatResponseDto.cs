namespace Application.DTOs;

public class ChatResponseDto
{
    public string Message { get; set; } = string.Empty;
    public List<SourceDto> Sources { get; set; } = new();
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public Guid SessionId { get; set; }
}