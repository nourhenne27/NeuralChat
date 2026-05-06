using MediatR;

namespace Application.Commands;

public record DeleteChatSessionCommand(Guid SessionId) : IRequest<Unit>;