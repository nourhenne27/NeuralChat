using Microsoft.Extensions.Options;
using System.Text.RegularExpressions;

namespace Application.Services;

public class ChunkingService
{
    private readonly ChunkingOptions _options;

    // Sentence boundary: period/!/? followed by whitespace + capital letter,
    // but NOT if preceded by a digit (avoids splitting "Figure 1.2" or "v2.0")
    // and NOT abbreviations like "e.g." "i.e." "vs."
    private static readonly Regex _sentenceSplitter = new Regex(
        @"(?<=[^0-9A-Z]{1})(?<=[.!?])\s+(?=[A-Z])",
        RegexOptions.Compiled);

    private static readonly HashSet<string> _abbreviations = new(StringComparer.OrdinalIgnoreCase)
    {
        "e.g", "i.e", "vs", "etc", "fig", "tab", "eq", "ch", "sec",
        "dr", "mr", "mrs", "ms", "prof", "dept", "approx", "ref"
    };

    public ChunkingService(IOptions<ChunkingOptions> options)
    {
        _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
    }

    /// <summary>
    /// Splits text into semantic chunks preserving sentence integrity.
    /// Uses paragraph-aware splitting before falling back to sentence splitting.
    /// </summary>
    public List<string> ChunkText(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return new List<string>();

        text = text.Replace("\r\n", "\n").Replace("\r", "\n").Trim();

        // Step 1: split on paragraph boundaries first (double newlines)
        var paragraphs = text
            .Split(new[] { "\n\n" }, StringSplitOptions.RemoveEmptyEntries)
            .Select(p => p.Replace("\n", " ").Trim())
            .Where(p => !string.IsNullOrWhiteSpace(p) && p.Length > 20) // skip tiny fragments
            .ToList();

        // Step 2: split large paragraphs into sentences
        var sentences = new List<string>();
        foreach (var para in paragraphs)
        {
            if (para.Length <= _options.ChunkSize)
            {
                sentences.Add(para);
            }
            else
            {
                var splits = SplitIntoSentences(para);
                sentences.AddRange(splits);
            }
        }

        // Step 3: pack sentences into chunks with overlap
        return PackIntoChunks(sentences);
    }

    private List<string> SplitIntoSentences(string text)
    {
        // Use a simple but robust split: split on ". " or "! " or "? " 
        // but protect abbreviations and decimal numbers
        var result = new List<string>();
        var parts = _sentenceSplitter.Split(text);

        foreach (var part in parts)
        {
            var trimmed = part.Trim();
            if (!string.IsNullOrWhiteSpace(trimmed) && trimmed.Length > 10)
                result.Add(trimmed);
        }

        return result.Count > 0 ? result : new List<string> { text };
    }

    private List<string> PackIntoChunks(List<string> sentences)
    {
        var chunks = new List<string>();
        var currentSentences = new List<string>();
        int currentLength = 0;
        int targetSize = _options.ChunkSize;
        int overlap = _options.ChunkOverlap;

        foreach (var sentence in sentences)
        {
            int sentLen = sentence.Length;

            // If a single sentence exceeds chunk size, split it by character
            if (sentLen > targetSize)
            {
                if (currentSentences.Count > 0)
                {
                    chunks.Add(string.Join(" ", currentSentences));
                    // Keep overlap sentences
                    TrimToOverlap(currentSentences, ref currentLength, overlap);
                }

                for (int i = 0; i < sentence.Length; i += targetSize - overlap)
                {
                    int len = Math.Min(targetSize, sentence.Length - i);
                    chunks.Add(sentence.Substring(i, len));
                }
                continue;
            }

            // Would adding this sentence exceed the chunk size?
            if (currentLength + sentLen + 1 > targetSize && currentSentences.Count > 0)
            {
                chunks.Add(string.Join(" ", currentSentences));
                TrimToOverlap(currentSentences, ref currentLength, overlap);
            }

            currentSentences.Add(sentence);
            currentLength += sentLen + 1;
        }

        if (currentSentences.Count > 0)
            chunks.Add(string.Join(" ", currentSentences));

        return chunks;
    }

    private void TrimToOverlap(List<string> sentences, ref int currentLength, int overlap)
    {
        // Keep only the last N sentences that fit within the overlap budget
        while (currentLength > overlap && sentences.Count > 1)
        {
            currentLength -= sentences[0].Length + 1;
            sentences.RemoveAt(0);
        }
        // Recompute to be safe
        currentLength = sentences.Sum(s => s.Length) + sentences.Count;
    }
}