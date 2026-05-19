using Domain.Entities;
using System.Text;
using System.Text.RegularExpressions;

namespace Application.Services;

public class PromptBuilderService
{
    private static readonly Regex _noiseChunkPattern = new Regex(
        @"^(figure\s+\d|fig\.\s*\d|table\s+\d|tab\.\s*\d|equation\s+\d" +
        @"|\d[\d\s\.\,]+$" +
        @"|[ivxlcdm]+\s*$)",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public string BuildPrompt(string userQuestion, IEnumerable<DocumentChunk> retrievedChunks)
    {
        var contextBuilder = new StringBuilder();

        contextBuilder.AppendLine("=== EXTRAITS DE DOCUMENTS ===");

        int i = 1;
        int skipped = 0;

        foreach (var chunk in retrievedChunks)
        {
            var content = chunk.Content?.Trim() ?? string.Empty;

            if (string.IsNullOrWhiteSpace(content)
                || content.Length < 30
                || _noiseChunkPattern.IsMatch(content))
            {
                skipped++;
                continue;
            }

            var sourceName = chunk.Document?.Name ?? "Document inconnu";
            contextBuilder.AppendLine($"--- Extrait {i} (Source : {sourceName}) ---");
            contextBuilder.AppendLine(content);
            contextBuilder.AppendLine();
            i++;
        }

        if (i == 1 && skipped > 0)
        {
            contextBuilder.AppendLine("(Note : seuls des extraits de faible qualité ont été récupérés.)");
            int j = 1;
            foreach (var chunk in retrievedChunks)
            {
                var sourceName = chunk.Document?.Name ?? "Document inconnu";
                contextBuilder.AppendLine($"--- Extrait {j} (Source : {sourceName}) ---");
                contextBuilder.AppendLine(chunk.Content?.Trim());
                contextBuilder.AppendLine();
                j++;
            }
        }

        contextBuilder.AppendLine("=== FIN DES EXTRAITS ===");
        contextBuilder.AppendLine();
        contextBuilder.AppendLine($"Question : {userQuestion}");
        contextBuilder.AppendLine();
        contextBuilder.AppendLine("Réponse directe (dans la même langue que la question) :");

        return contextBuilder.ToString();
    }
} 