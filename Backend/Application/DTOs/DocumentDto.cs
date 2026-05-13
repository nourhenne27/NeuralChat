namespace Application.DTOs;

public class DocumentDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Format { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string RoleRequired { get; set; } = string.Empty; 
    public DateTime UploadedAt { get; set; }
}