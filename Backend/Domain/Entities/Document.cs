using Domain.Enums;

namespace Domain.Entities;

public class Document
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public DocFormat Format { get; set; }
    public DocumentStatus Status { get; set; } = DocumentStatus.Pending;
    public UserRole RoleRequired { get; set; } = UserRole.User;
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    public ICollection<DocumentChunk> Chunks { get; set; } = new List<DocumentChunk>();
}