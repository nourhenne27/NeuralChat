using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using Domain.Interfaces;
using System.Text;

namespace Infrastructure.FileProcessing;

public class WordExtractor : IFileTextExtractor
{
    public async Task<string> ExtractTextAsync(Stream fileStream, string fileName)
    {
        using var doc = WordprocessingDocument.Open(fileStream, false);
        var body = doc.MainDocumentPart?.Document.Body;

        if (body is null)
            return string.Empty;

        var sb = new StringBuilder();

        foreach (var element in body.ChildElements)
        {
            switch (element)
            {
                case Paragraph paragraph:
                    var paraText = paragraph.InnerText.Trim();
                    if (!string.IsNullOrEmpty(paraText))
                        sb.AppendLine(paraText);
                    break;

                case Table table:
                    foreach (var row in table.Elements<TableRow>())
                    {
                        var cells = row.Elements<TableCell>()
                                       .Select(c => c.InnerText.Trim());
                        sb.AppendLine(string.Join(" | ", cells));
                    }
                    sb.AppendLine();
                    break;

                default:
                    var defaultText = element.InnerText.Trim();
                    if (!string.IsNullOrEmpty(defaultText))
                        sb.AppendLine(defaultText);
                    break;
            }
        }

        return await Task.FromResult(sb.ToString().Trim());
    }
}