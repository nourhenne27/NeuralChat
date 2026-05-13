using MediatR;
using Application.DTOs;
using Domain.Interfaces;
using System.Text.Json;

namespace Application.Queries;

public record GetChatHistoryQuery(Guid SessionId) : IRequest<List<ChatMessageDto>>;

public class GetChatHistoryQueryHandler
    : IRequestHandler<GetChatHistoryQuery, List<ChatMessageDto>>
{
    private readonly IChatSessionRepository _chatSessionRepository;

    // ✅ CaseInsensitive pour gérer l'ancien PascalCase ET le nouveau camelCase
    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public GetChatHistoryQueryHandler(IChatSessionRepository chatSessionRepository)
    {
        _chatSessionRepository = chatSessionRepository;
    }

    public async Task<List<ChatMessageDto>> Handle(
        GetChatHistoryQuery request,
        CancellationToken cancellationToken)
    {
        var session = await _chatSessionRepository.GetByIdAsync(request.SessionId);

        return session.Messages
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
            .ToList();
    }

    private static List<SourceDto> DeserializeSources(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return [];
        try { return JsonSerializer.Deserialize<List<SourceDto>>(json, _jsonOptions) ?? []; }
        catch { return []; }
    }
}