using MediatR;

namespace Application.Commands;

public record DeleteDocumentCommand(Guid DocumentId) : IRequest<Unit>;
