using MediatR;
using Application.DTOs;
using Domain.Interfaces;

namespace Application.Queries;

// Retourne les messages d'UNE session spécifique (par sessionId)
// Pour la liste de toutes les sessions d'un user → utiliser GetUserSessionsQuery
public record GetChatHistoryQuery(Guid SessionId) : IRequest<List<ChatMessageDto>>;

public class GetChatHistoryQueryHandler
    : IRequestHandler<GetChatHistoryQuery, List<ChatMessageDto>>
{
    private readonly IChatSessionRepository _chatSessionRepository;

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
                CreatedAt = m.CreatedAt
            })
            .ToList();
    }
}