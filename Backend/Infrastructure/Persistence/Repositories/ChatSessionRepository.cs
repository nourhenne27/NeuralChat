using Microsoft.EntityFrameworkCore;
using Domain.Entities;
using Domain.Interfaces;
using Infrastructure.Persistence.Auth;

namespace Infrastructure.Persistence.Repositories;

public class ChatSessionRepository : IChatSessionRepository
{
    private readonly SqlServerDbContext _context;

    public ChatSessionRepository(SqlServerDbContext context)
    {
        _context = context;
    }

    public async Task<ChatSession> GetByIdAsync(Guid id)
        => await _context.ChatSessions
            .Include(s => s.Messages)
            .FirstOrDefaultAsync(s => s.Id == id)
            ?? throw new KeyNotFoundException();

    public async Task<IEnumerable<ChatSession>> GetByUserIdAsync(Guid userId)
        => await _context.ChatSessions
            .Include(s => s.Messages)
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

    public async Task AddAsync(ChatSession session)
    {
        await _context.ChatSessions.AddAsync(session);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(ChatSession session)
    {
        foreach (var message in session.Messages)
        {
            var state = _context.Entry(message).State;
            if (state == EntityState.Detached)
            {
                var exists = await _context.Set<ChatMessage>().AnyAsync(m => m.Id == message.Id);
                if (!exists)
                    _context.Set<ChatMessage>().Add(message);
                else
                    _context.Entry(message).State = EntityState.Modified;
            }
        }
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid id)
    {
        var session = await _context.ChatSessions
            .Include(s => s.Messages)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (session != null)
        {
            // Supprimer les feedbacks liés aux messages
            var messageIds = session.Messages.Select(m => m.Id).ToList();
            var feedbacks = await _context.Feedbacks
                .Where(f => messageIds.Contains(f.MessageId))
                .ToListAsync();

            _context.Feedbacks.RemoveRange(feedbacks);
            _context.ChatMessages.RemoveRange(session.Messages);
            _context.ChatSessions.Remove(session);
            await _context.SaveChangesAsync();
        }
    }

    // ← Nouveau : insère directement les messages sans recharger la session
    public async Task AddMessagesAsync(Guid sessionId, params ChatMessage[] messages)
    {
        await _context.ChatMessages.AddRangeAsync(messages);
        await _context.SaveChangesAsync();
    }
}