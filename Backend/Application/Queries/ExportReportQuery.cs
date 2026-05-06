using Application.Common.Interfaces;
using Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Queries;

public record ExportReportQuery : IRequest<ExportReportDto>;

public class ExportReportQueryHandler : IRequestHandler<ExportReportQuery, ExportReportDto>
{
    private readonly ISqlServerDbContext _sqlContext;
    private readonly IVectorDbContext _vectorContext;

    public ExportReportQueryHandler(ISqlServerDbContext sqlContext, IVectorDbContext vectorContext)
    {
        _sqlContext = sqlContext;
        _vectorContext = vectorContext;
    }

    public async Task<ExportReportDto> Handle(ExportReportQuery request, CancellationToken cancellationToken)
    {
        var users = await _sqlContext.ChatSessions
            .Where(s => s.User != null)
            .Select(s => s.User)
            .Distinct()
            .Select(u => new UserDto
            {
                Id = u.Id,
                Email = u.Email,
                Role = u.Role.ToString()
            })
            .ToListAsync(cancellationToken);

        var totalQuestions = await _sqlContext.ChatSessions
            .CountAsync(s => s.User != null, cancellationToken);

        var totalDocuments = await _vectorContext.Documents
            .CountAsync(cancellationToken);

        var averageScore = await _sqlContext.Feedbacks
            .AverageAsync(f => (double?)f.Score, cancellationToken) ?? 0.0;

        var averageConfidenceScore = Math.Round(averageScore / 5.0 * 100, 1);

        var recentActivity = await _sqlContext.ChatSessions
            .Include(s => s.User)
            .OrderByDescending(s => s.CreatedAt)
            .Take(20)
            .Select(s => new ActivityItemDto
            {
                Actor = s.User.Email,
                Action = "a démarré une session de chat",
                OccurredAt = s.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return new ExportReportDto
        {
            GeneratedAt = DateTime.UtcNow,
            Stats = new AdminStatsDto
            {
                TotalQuestions = totalQuestions,
                TotalDocuments = totalDocuments,
                TotalUsers = users.Count,
                AverageConfidenceScore = averageConfidenceScore
            },
            Users = users,
            RecentActivity = recentActivity
        };
    }
}