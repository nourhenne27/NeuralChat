using MediatR;
using Domain.Interfaces;

namespace Application.Commands;

public class DeleteDocumentCommandHandler : IRequestHandler<DeleteDocumentCommand, Unit>
{
    private readonly IDocumentRepository _documentRepository;
    private readonly IVectorStore _vectorStore;

    public DeleteDocumentCommandHandler(IDocumentRepository documentRepository, IVectorStore vectorStore)
    {
        _documentRepository = documentRepository;
        _vectorStore = vectorStore;
    }

    public async Task<Unit> Handle(DeleteDocumentCommand request, CancellationToken cancellationToken)
    {
        await _vectorStore.DeleteByDocumentIdAsync(request.DocumentId);
        await _documentRepository.DeleteAsync(request.DocumentId);

        return Unit.Value;
    }
}