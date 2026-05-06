using Domain.Interfaces;

namespace Infrastructure.FileProcessing;

public class TextExtractor : IFileTextExtractor
{
    public async Task<string> ExtractTextAsync(Stream fileStream, string fileName)
    {
        using var reader = new StreamReader(fileStream);
        return await reader.ReadToEndAsync();
    }
}
