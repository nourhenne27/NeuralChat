namespace Domain.Entities;

public class Feedback
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MessageId { get; set; }
    public Guid UserId { get; set; }
    public int Score { get; set; } // 1 à 5
    public string? Comment { get; set; }

    public ChatMessage Message { get; set; } = null!;
    public User User { get; set; } = null!;
}
