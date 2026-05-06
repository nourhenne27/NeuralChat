using MediatR;
using Domain.Enums;

namespace Application.Commands;

// ✅ PLUS DE IFormFile ICI
public record IndexDocumentCommand(
    byte[] FileContent,
    string FileName,
    UserRole RoleRequired
) : IRequest<IndexDocumentResponse>;

public class IndexDocumentResponse
{
    public Guid DocumentId { get; set; }
    public string Message { get; set; } = string.Empty;
}