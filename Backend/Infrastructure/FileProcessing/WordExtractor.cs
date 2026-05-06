using DocumentFormat.OpenXml.Packaging;
using Domain.Interfaces;

namespace Infrastructure.FileProcessing;

public class WordExtractor : IFileTextExtractor
{
    public async Task<string> ExtractTextAsync(Stream fileStream, string fileName)
    {
        using var doc = WordprocessingDocument.Open(fileStream, false);
        var body = doc.MainDocumentPart?.Document.Body;
        var text = body?.InnerText ?? string.Empty;

        return await Task.FromResult(text);
    }
}