using Pgvector;
using Vector = Pgvector.Vector;
namespace Domain.Interfaces;

public interface IEmbeddingService
{
    Task<Vector> GenerateEmbeddingAsync(string text);
    Task<IReadOnlyList<Vector>> GenerateEmbeddingsAsync(IEnumerable<string> texts);
}