using System.ComponentModel.DataAnnotations;

namespace Application.DTOs;

public class FeedbackDto
{
    public Guid MessageId { get; set; }

    [Range(1, 5, ErrorMessage = "Score doit être entre 1 et 5")]
    public int Score { get; set; }          // 1 à 5

    public string? Comment { get; set; }
}