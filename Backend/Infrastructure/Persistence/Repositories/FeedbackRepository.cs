using Microsoft.EntityFrameworkCore;
using Domain.Entities;
using Domain.Interfaces;
using Infrastructure.Persistence.Auth;

namespace Infrastructure.Persistence.Repositories;

public class FeedbackRepository : IFeedbackRepository
{
    private readonly SqlServerDbContext _context;

    public FeedbackRepository(SqlServerDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(Feedback feedback)
    {
        await _context.Feedbacks.AddAsync(feedback);
        await _context.SaveChangesAsync();
    }

    public async Task<IEnumerable<Feedback>> GetByMessageIdAsync(Guid messageId)
        => await _context.Feedbacks
            .Where(f => f.MessageId == messageId)
            .ToListAsync();
}