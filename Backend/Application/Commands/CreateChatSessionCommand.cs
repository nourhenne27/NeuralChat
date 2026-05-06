using MediatR;

namespace Application.Commands;

public record CreateChatSessionCommand(Guid UserId) : IRequest<Guid>;