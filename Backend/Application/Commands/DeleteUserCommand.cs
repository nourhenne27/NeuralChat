using MediatR;

namespace Application.Commands;

public record DeleteUserCommand(Guid UserId) : IRequest;