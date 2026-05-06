using Domain.Entities;
using Domain.Interfaces;
using Infrastructure.Persistence.RAG;
using Microsoft.EntityFrameworkCore;
using Pgvector;
using Pgvector.EntityFrameworkCore;

namespace Infrastructure.VectorStore;

public class VectorStoreService : IVectorStore
{
    private readonly VectorDbContext _context;

    public VectorStoreService(VectorDbContext context)
    {
        _context = context;
    }

    public async Task StoreChunksAsync(IEnumerable<DocumentChunk> chunks)
    {
        await _context.DocumentChunks.AddRangeAsync(chunks);
        await _context.SaveChangesAsync();
    }

    public async Task<IEnumerable<(DocumentChunk Chunk, float Score)>> SearchAsync(
        Vector embedding,
        int topK = 5,
        float similarityThreshold = 0.60f)
    {
        var maxDistance = 1f - similarityThreshold; // cosine distance threshold

        // Project the cosine distance into a named column so we can return it
        var results = await _context.DocumentChunks
            .Include(c => c.Document)
            .Where(c => c.Embedding != null &&
                        c.Embedding!.CosineDistance(embedding) < maxDistance)
            .Select(c => new
            {
                Chunk = c,
                Distance = c.Embedding!.CosineDistance(embedding)
            })
            .OrderBy(x => x.Distance)
            .ThenByDescending(x => x.Chunk.PositiveFeedbackCount)
            .Take(topK)
            .ToListAsync();

        return results.Select(x => (
            x.Chunk,
            Score: (float)Math.Round(1.0 - x.Distance, 4) // convert distance → similarity
        ));
    }

    public async Task RecordPositiveFeedbackAsync(IEnumerable<Guid> chunkIds)
    {
        if (chunkIds == null || !chunkIds.Any())
            return;

        var chunks = await _context.DocumentChunks
            .Where(c => chunkIds.Contains(c.Id))
            .ToListAsync();

        foreach (var chunk in chunks)
            chunk.PositiveFeedbackCount++;

        await _context.SaveChangesAsync();
    }

    public async Task DeleteByDocumentIdAsync(Guid documentId)
    {
        var chunksToDelete = await _context.DocumentChunks
            .Where(c => c.DocumentId == documentId)
            .ToListAsync();

        _context.DocumentChunks.RemoveRange(chunksToDelete);
        await _context.SaveChangesAsync();
    }
}