using System.ComponentModel.DataAnnotations;

namespace Application.DTOs;

public class ChatRequestDto
{
    // Guid? permet au frontend d'omettre sessionId explicitement.
    // null → le handler crée une nouvelle session automatiquement.
    // Guid non-null → le handler rattache le message à la session existante.
    public Guid? SessionId { get; set; }

    [Required(ErrorMessage = "Message is required")]
    [MinLength(1, ErrorMessage = "Message cannot be empty")]
    [MaxLength(2000, ErrorMessage = "Message cannot exceed 2000 characters")]
    public string Message { get; set; } = string.Empty;
}
