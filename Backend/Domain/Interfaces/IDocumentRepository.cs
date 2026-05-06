using Domain.Entities;
using Domain.Enums;

namespace Domain.Interfaces;

public interface IDocumentRepository
{
    Task<Document> GetByIdAsync(Guid id);
    Task<IEnumerable<Document>> GetAllAsync(UserRole userRole);
    Task AddAsync(Document document);
    Task UpdateAsync(Document document);
    Task DeleteAsync(Guid id);
    Task<bool> ExistsAsync(Guid id);
}