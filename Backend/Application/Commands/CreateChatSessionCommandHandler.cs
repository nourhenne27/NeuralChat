using MediatR;
using Domain.Entities;
using Domain.Interfaces;

namespace Application.Commands;

public class CreateChatSessionCommandHandler : IRequestHandler<CreateChatSessionCommand, Guid>
{
    private readonly IChatSessionRepository _chatSessionRepository;

    public CreateChatSessionCommandHandler(IChatSessionRepository chatSessionRepository)
    {
        _chatSessionRepository = chatSessionRepository;
    }

    public async Task<Guid> Handle(CreateChatSessionCommand request, CancellationToken cancellationToken)
    {
        var session = new ChatSession
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            Title = "Nouvelle conversation",
            CreatedAt = DateTime.UtcNow
        };

        await _chatSessionRepository.AddAsync(session);

        return session.Id;
    }
}