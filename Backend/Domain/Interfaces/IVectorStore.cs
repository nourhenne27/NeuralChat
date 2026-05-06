using Domain.Entities;
using Vector = Pgvector.Vector;

namespace Domain.Interfaces;

public interface IVectorStore
{
    Task StoreChunksAsync(IEnumerable<DocumentChunk> chunks);

    /// <summary>
    /// Returns chunks paired with their real cosine similarity score (0–1).
    /// Score = 1 - cosine_distance.
    /// </summary>
    Task<IEnumerable<(DocumentChunk Chunk, float Score)>> SearchAsync(
        Vector embedding, int topK, float similarityThreshold);

    Task DeleteByDocumentIdAsync(Guid documentId);
    Task RecordPositiveFeedbackAsync(IEnumerable<Guid> chunkIds);
}