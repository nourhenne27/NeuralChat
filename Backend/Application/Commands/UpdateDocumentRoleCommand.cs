using MediatR;
using Domain.Enums;
using Domain.Interfaces;

namespace Application.Commands;

public record UpdateDocumentRoleCommand(
    Guid DocumentId,
    UserRole RoleRequired
) : IRequest;

public class UpdateDocumentRoleCommandHandler : IRequestHandler<UpdateDocumentRoleCommand>
{
    private readonly IDocumentRepository _documentRepository;

    public UpdateDocumentRoleCommandHandler(IDocumentRepository documentRepository)
    {
        _documentRepository = documentRepository;
    }

    public async Task Handle(UpdateDocumentRoleCommand request, CancellationToken cancellationToken)
    {
        var document = await _documentRepository.GetByIdAsync(request.DocumentId);
        if (document == null)
            throw new KeyNotFoundException($"Document {request.DocumentId} introuvable.");

        document.RoleRequired = request.RoleRequired;
        await _documentRepository.UpdateAsync(document);
    }
}
