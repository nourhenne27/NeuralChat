using Domain.Entities;

namespace Domain.Interfaces;

public interface IChatSessionRepository
{
    Task<ChatSession> GetByIdAsync(Guid id);
    Task<IEnumerable<ChatSession>> GetByUserIdAsync(Guid userId);
    Task AddAsync(ChatSession session);
    Task UpdateAsync(ChatSession session);
    Task DeleteAsync(Guid id);
    Task AddMessagesAsync(Guid sessionId, params ChatMessage[] messages); // ← Nouveau
}