using Application.Common.Interfaces;
using Application.DTOs;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Queries;

public record GetAdminStatsQuery : IRequest<AdminStatsDto>;

public class GetAdminStatsQueryHandler : IRequestHandler<GetAdminStatsQuery, AdminStatsDto>
{
    private readonly ISqlServerDbContext _sqlContext;
    private readonly IVectorDbContext _vectorContext;

    public GetAdminStatsQueryHandler(ISqlServerDbContext sqlContext, IVectorDbContext vectorContext)
    {
        _sqlContext = sqlContext;
        _vectorContext = vectorContext;
    }

    public async Task<AdminStatsDto> Handle(GetAdminStatsQuery request, CancellationToken cancellationToken)
    {
        var totalQuestions = await _sqlContext.ChatSessions
            .SelectMany(s => s.Messages)
            .Where(m => m.Role == "user")
            .CountAsync(cancellationToken);

        var totalDocuments = await _vectorContext.Documents
            .CountAsync(cancellationToken);

        var totalUsers = await _sqlContext.Users
            .CountAsync(cancellationToken);

        var averageScore = await _sqlContext.Feedbacks
            .AverageAsync(f => (double?)f.Score, cancellationToken) ?? 0.0;

        var averageConfidenceScore = Math.Round(averageScore / 5.0 * 100, 1);

        return new AdminStatsDto
        {
            TotalQuestions = totalQuestions,
            TotalDocuments = totalDocuments,
            TotalUsers = totalUsers,
            AverageConfidenceScore = averageConfidenceScore
        };
    }
}