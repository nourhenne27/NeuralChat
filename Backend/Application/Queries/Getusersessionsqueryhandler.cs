using MediatR;
using Application.DTOs;
using Domain.Interfaces;

namespace Application.Queries;

public class GetUserSessionsQueryHandler
    : IRequestHandler<GetUserSessionsQuery, List<ChatSessionDto>>
{
    private readonly IChatSessionRepository _chatSessionRepository;

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
                        CreatedAt = m.CreatedAt
                    })
                    .ToList()
            })
            .ToList();
    }
}