using Domain.Entities;
using System.Text;
using System.Text.RegularExpressions;

namespace Application.Services;

public class PromptBuilderService
{
    // Detects chunks that are mostly figure/table references or metadata noise
    private static readonly Regex _noiseChunkPattern = new Regex(
        @"^(figure\s+\d|fig\.\s*\d|table\s+\d|tab\.\s*\d|equation\s+\d" +
        @"|\d[\d\s\.\,]+$" +
        @"|[ivxlcdm]+\s*$)",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public string BuildPrompt(string userQuestion, IEnumerable<DocumentChunk> retrievedChunks)
    {
        var contextBuilder = new StringBuilder();

        contextBuilder.AppendLine("You are a helpful assistant answering questions based strictly on the provided document excerpts.");
        contextBuilder.AppendLine();
        contextBuilder.AppendLine("STRICT RULES:");
        contextBuilder.AppendLine("- Answer ONLY from the excerpts below. Do not use external knowledge.");
        contextBuilder.AppendLine("- Answer DIRECTLY without preamble or hedging.");
        contextBuilder.AppendLine("- If the answer is clearly present in the excerpts, state it concisely.");
        contextBuilder.AppendLine("- IGNORE excerpts that contain only figure labels, table numbers, page numbers, or similar non-prose content.");
        contextBuilder.AppendLine("- If the answer is truly not found in the prose excerpts, say: \"I could not find this information in the provided documents.\"");
        contextBuilder.AppendLine("- Answer in the SAME LANGUAGE as the question (French → French, English → English).");
        contextBuilder.AppendLine("- Be concise and precise. Do not repeat the question.");
        contextBuilder.AppendLine();
        contextBuilder.AppendLine("=== DOCUMENT EXCERPTS ===");

        int i = 1;
        int skipped = 0;
        foreach (var chunk in retrievedChunks)
        {
            var content = chunk.Content?.Trim() ?? string.Empty;

            // Skip noise chunks (figure labels, page numbers, etc.)
            if (string.IsNullOrWhiteSpace(content)
                || content.Length < 30
                || _noiseChunkPattern.IsMatch(content))
            {
                skipped++;
                continue;
            }

            var sourceName = chunk.Document?.Name ?? "Unknown document";

            contextBuilder.AppendLine($"--- Excerpt {i} (Source: {sourceName}) ---");
            contextBuilder.AppendLine(content);
            contextBuilder.AppendLine();
            i++;
        }

        // If all chunks were noise, include them anyway with a warning so the LLM can handle it
        if (i == 1 && skipped > 0)
        {
            contextBuilder.AppendLine("(Note: only low-quality excerpts were retrieved — they may be figure labels or metadata.)");
            int j = 1;
            foreach (var chunk in retrievedChunks)
            {
                var sourceName = chunk.Document?.Name ?? "Unknown document";
                contextBuilder.AppendLine($"--- Excerpt {j} (Source: {sourceName}) ---");
                contextBuilder.AppendLine(chunk.Content?.Trim());
                contextBuilder.AppendLine();
                j++;
            }
        }

        contextBuilder.AppendLine("=== END OF EXCERPTS ===");
        contextBuilder.AppendLine();
        contextBuilder.AppendLine($"Question: {userQuestion}");
        contextBuilder.AppendLine();
        contextBuilder.AppendLine("Direct answer (in the same language as the question):");

        return contextBuilder.ToString();
    }
}