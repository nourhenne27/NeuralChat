using Domain.Entities;
using Application.Services;
using Domain.Enums;
using Domain.Interfaces;
using MediatR;

namespace Application.Commands;

public class IndexDocumentCommandHandler : IRequestHandler<IndexDocumentCommand, IndexDocumentResponse>
{
    private readonly IFileTextExtractor _fileTextExtractor;
    private readonly ChunkingService _chunkingService;
    private readonly IEmbeddingService _embeddingService;
    private readonly IDocumentRepository _documentRepository;
    private readonly IVectorStore _vectorStore;

    public IndexDocumentCommandHandler(
        IFileTextExtractor fileTextExtractor,
        ChunkingService chunkingService,
        IEmbeddingService embeddingService,
        IDocumentRepository documentRepository,
        IVectorStore vectorStore)
    {
        _fileTextExtractor = fileTextExtractor;
        _chunkingService = chunkingService;
        _embeddingService = embeddingService;
        _documentRepository = documentRepository;
        _vectorStore = vectorStore;
    }

    public async Task<IndexDocumentResponse> Handle(
        IndexDocumentCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Convertir byte[] → Stream
        using var stream = new MemoryStream(request.FileContent);

        // 2. Extraire le texte
        var text = await _fileTextExtractor.ExtractTextAsync(stream, request.FileName);

        // ✅ Validation : texte vide = document illisible ou corrompu
        if (string.IsNullOrWhiteSpace(text))
            throw new InvalidOperationException(
                $"Impossible d'extraire du texte du fichier '{request.FileName}'. " +
                "Le fichier est peut-être vide, corrompu ou dans un format non supporté.");

        // 3. Créer le Document
        var document = new Document
        {
            Name = request.FileName,
            Format = Enum.Parse<DocFormat>(
                Path.GetExtension(request.FileName).TrimStart('.'),
                ignoreCase: true
            ),
            RoleRequired = request.RoleRequired,
            Status = DocumentStatus.Pending
        };

        await _documentRepository.AddAsync(document);

        // 4. Chunking + Embedding
        var chunksText = _chunkingService.ChunkText(text);

        // ✅ Validation : pas de chunks générés (texte trop court ?)
        if (!chunksText.Any())
            throw new InvalidOperationException(
                $"Le document '{request.FileName}' n'a pas pu être découpé en chunks. " +
                "Vérifiez que le contenu est suffisamment long.");

        var embeddings = await _embeddingService.GenerateEmbeddingsAsync(chunksText);

        var documentChunks = chunksText.Zip(embeddings, (content, embedding) => new DocumentChunk
        {
            DocumentId = document.Id,
            Content = content,
            Embedding = embedding
        }).ToList();

        await _vectorStore.StoreChunksAsync(documentChunks);

        // 5. Mettre à jour le statut → Indexed
        document.Status = DocumentStatus.Indexed;
        await _documentRepository.UpdateAsync(document);

        return new IndexDocumentResponse
        {
            DocumentId = document.Id,
            Message = $"Document indexé avec succès ({documentChunks.Count} chunks créés)"
        };
    }
}