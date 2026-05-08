using MediatR;
using Application.DTOs;
using Domain.Interfaces;
using System.Text.Json;

namespace Application.Queries;

public class GetUserSessionsQueryHandler
    : IRequestHandler<GetUserSessionsQuery, List<ChatSessionDto>>
{
    private readonly IChatSessionRepository _chatSessionRepository;

    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public GetUserSessionsQueryHandler(IChatSessionRepository chatSessionRepository)
    {
        _chatSessionRepository = chatSessionRepository;
    }

    public async Task<List<ChatSessionDto>> Handle(
        GetUserSessionsQuery request,
        CancellationToken cancellationToken)
    {
        var sessions = await _chatSessionRepository.GetByUserIdAsync(request.UserId);

        return sessions
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new ChatSessionDto
            {
                Id = s.Id,
                Title = s.Title,
                CreatedAt = s.CreatedAt,
                Messages = s.Messages
                    .OrderBy(m => m.CreatedAt)
                    .Select(m => new ChatMessageDto
                    {
                        Id = m.Id,
                        SessionId = m.SessionId,
                        Role = m.Role,
                        Content = m.Content,
                        CreatedAt = m.CreatedAt,
                        Sources = DeserializeSources(m.SourcesJson)
                    })
                    .ToList()
            })
            .ToList();
    }

    private static List<SourceDto> DeserializeSources(string? sourcesJson)
    {
        if (string.IsNullOrWhiteSpace(sourcesJson)) return [];
        try
        {
            return JsonSerializer.Deserialize<List<SourceDto>>(sourcesJson, _jsonOptions) ?? [];
        }
        catch
        {
            return [];
        }
    }
}