namespace Domain.Interfaces;

public interface IFileTextExtractor
{
    Task<string> ExtractTextAsync(Stream fileStream, string fileName);
}