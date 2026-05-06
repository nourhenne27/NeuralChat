using Domain.Entities;

namespace Domain.Interfaces;

public interface IFeedbackRepository
{
    Task AddAsync(Feedback feedback);
    Task<IEnumerable<Feedback>> GetByMessageIdAsync(Guid messageId);
}