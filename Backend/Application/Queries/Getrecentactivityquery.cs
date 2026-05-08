using Application.Common.Interfaces;
using Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Queries;

public record GetRecentActivityQuery(int Limit = 20) : IRequest<IEnumerable<ActivityItemDto>>;

public class GetRecentActivityQueryHandler : IRequestHandler<GetRecentActivityQuery, IEnumerable<ActivityItemDto>>
{
    private readonly ISqlServerDbContext _sqlContext;
    private readonly IVectorDbContext _vectorContext;

    public GetRecentActivityQueryHandler(ISqlServerDbContext sqlContext, IVectorDbContext vectorContext)
    {
        _sqlContext = sqlContext;
        _vectorContext = vectorContext;
    }

    public async Task<IEnumerable<ActivityItemDto>> Handle(GetRecentActivityQuery request, CancellationToken cancellationToken)
    {
        var activities = new List<ActivityItemDto>();

        // Sessions de chat
        var sessions = await _sqlContext.ChatSessions
            .Include(s => s.User)
            .Where(s => s.User != null)
            .OrderByDescending(s => s.CreatedAt)
            .Take(request.Limit)
            .ToListAsync(cancellationToken);

        activities.AddRange(sessions.Select(s => new ActivityItemDto
        {
            Actor = s.User!.Email.Split('@')[0],
            Action = "a démarré une session de chat",
            OccurredAt = s.CreatedAt
        }));

        // Feedbacks — on utilise Message.CreatedAt car Feedback n'a pas de CreatedAt propre
        var feedbacks = await _sqlContext.Feedbacks
            .Include(f => f.User)
            .Include(f => f.Message)
            .Where(f => f.User != null)
            .OrderByDescending(f => f.Message.CreatedAt)
            .Take(request.Limit)
            .ToListAsync(cancellationToken);

        activities.AddRange(feedbacks.Select(f => new ActivityItemDto
        {
            Actor = f.User!.Email.Split('@')[0],
            Action = f.Score >= 4 ? "a soumis un feedback positif" : "a soumis un feedback",
            OccurredAt = f.Message?.CreatedAt ?? DateTime.UtcNow
        }));

        // Documents indexés
        var documents = await _vectorContext.Documents
            .OrderByDescending(d => d.UploadedAt)
            .Take(request.Limit)
            .ToListAsync(cancellationToken);

        activities.AddRange(documents.Select(d => new ActivityItemDto
        {
            Actor = "Système",
            Action = $"a indexé {d.Name}",
            OccurredAt = d.UploadedAt
        }));

        return activities
            .OrderByDescending(a => a.OccurredAt)
            .Take(request.Limit);
    }
}