using MediatR;

namespace Application.Commands;

public record RenameSessionCommand(Guid SessionId, string NewTitle) : IRequest<Unit>;
