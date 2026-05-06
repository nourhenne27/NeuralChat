using Domain.Enums;

namespace Application.DTOs;

public class DocumentDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DocFormat Format { get; set; }
    public DocumentStatus Status { get; set; }
    public DateTime UploadedAt { get; set; }
}