using MediatR;
using Domain.Interfaces;
using Domain.Enums;

namespace Application.Commands;

public class DeleteDocumentCommandHandler : IRequestHandler<DeleteDocumentCommand, Unit>
{
    private readonly IDocumentRepository _documentRepository;
    private readonly IVectorStore _vectorStore;

    public DeleteDocumentCommandHandler(
        IDocumentRepository documentRepository,
        IVectorStore vectorStore)
    {
        _documentRepository = documentRepository;
        _vectorStore = vectorStore;
    }

    public async Task<Unit> Handle(DeleteDocumentCommand request, CancellationToken cancellationToken)
    {
        // ✅ Étape 1 : marquer le document comme "en cours de suppression"
        // Évite qu'il apparaisse dans les listes si l'étape 2 échoue
        var document = await _documentRepository.GetByIdAsync(request.DocumentId);
        if (document == null)
            throw new KeyNotFoundException($"Document {request.DocumentId} introuvable.");

        document.Status = DocumentStatus.Deleting;
        await _documentRepository.UpdateAsync(document);

        // ✅ Étape 2 : supprimer les chunks dans PostgreSQL
        await _vectorStore.DeleteByDocumentIdAsync(request.DocumentId);

        // ✅ Étape 3 : supprimer le document dans SQL Server
        await _documentRepository.DeleteAsync(request.DocumentId);

        return Unit.Value;
    }
}