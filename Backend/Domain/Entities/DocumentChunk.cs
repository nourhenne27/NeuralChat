using Pgvector;
using Vector = Pgvector.Vector;

namespace Domain.Entities;

public class DocumentChunk
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DocumentId { get; set; }
    public Document Document { get; set; } = null!;
    public string Content { get; set; } = string.Empty;
    public Vector Embedding { get; set; } = null!;

    // ← NOUVEAU : Feedback positif accumulé
    public int PositiveFeedbackCount { get; set; } = 0;
}