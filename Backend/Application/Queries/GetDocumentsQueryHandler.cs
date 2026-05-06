using MediatR;
using Domain.Interfaces;
using Application.DTOs;

namespace Application.Queries;

public class GetDocumentsQueryHandler : IRequestHandler<GetDocumentsQuery, List<DocumentDto>>
{
    private readonly IDocumentRepository _documentRepository;

    public GetDocumentsQueryHandler(IDocumentRepository documentRepository)
    {
        _documentRepository = documentRepository;
    }

    public async Task<List<DocumentDto>> Handle(GetDocumentsQuery request, CancellationToken cancellationToken)
    {
        var documents = await _documentRepository.GetAllAsync(request.UserRole);

        return documents.Select(d => new DocumentDto
        {
            Id = d.Id,
            Name = d.Name,
            Format = d.Format,
            Status = d.Status,
            UploadedAt = d.UploadedAt
        }).ToList();
    }
}