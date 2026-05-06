namespace Application.DTOs;

public class ActivityItemDto
{
    public string Actor { get; set; } = string.Empty;   // ex: "Admin", "Sarah"
    public string Action { get; set; } = string.Empty;  // ex: "a uploadé Architecture_v2.pdf"
    public DateTime OccurredAt { get; set; }
}
