using Domain.Interfaces;
using Infrastructure.FileProcessing;

namespace Infrastructure.FileProcessing;

public class FileTextExtractorFactory : IFileTextExtractor
{
    private readonly PdfExtractor _pdfExtractor;
    private readonly WordExtractor _wordExtractor;
    private readonly TextExtractor _textExtractor;

    public FileTextExtractorFactory(
        PdfExtractor pdfExtractor,
        WordExtractor wordExtractor,
        TextExtractor textExtractor)
    {
        _pdfExtractor = pdfExtractor;
        _wordExtractor = wordExtractor;
        _textExtractor = textExtractor;
    }

    public Task<string> ExtractTextAsync(Stream fileStream, string fileName)
    {
        var ext = Path.GetExtension(fileName).TrimStart('.').ToLowerInvariant();

        return ext switch
        {
            "pdf" => _pdfExtractor.ExtractTextAsync(fileStream, fileName),
            "docx" => _wordExtractor.ExtractTextAsync(fileStream, fileName),
            "txt" => _textExtractor.ExtractTextAsync(fileStream, fileName),
            _ => throw new NotSupportedException(
                $"Format '{ext}' non supporté. Formats acceptés : pdf, docx, txt.")
        };
    }
}