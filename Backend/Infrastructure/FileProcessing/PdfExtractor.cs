using UglyToad.PdfPig;
using UglyToad.PdfPig.Content;
using Domain.Interfaces;
using System.Text;
using System.Text.RegularExpressions;

namespace Infrastructure.FileProcessing;

public class PdfExtractor : IFileTextExtractor
{
    // ---------------------------------------------------------------
    // Pages whose FIRST LINE matches → skip the entire page.
    // Covers: Table of Contents, List of Figures/Tables, Abbreviations,
    // Abstract, Résumé, Acknowledgements — in French and English.
    // ---------------------------------------------------------------
    private static readonly Regex _frontmatterPage = new(
        @"^(table\s+des\s+mati[eè]res|liste\s+des\s+tableaux|liste\s+des\s+figures"
        + @"|liste\s+des\s+abr[eé]viations|table\s+of\s+contents|list\s+of\s+figures"
        + @"|list\s+of\s+tables|list\s+of\s+abbreviations|abbreviations"
        + @"|abstract|r[eé]sum[eé]|acknowledgements?|remerciements?)",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    // ---------------------------------------------------------------
    // Lines to DISCARD regardless of which page they appear on.
    // ---------------------------------------------------------------
    private static readonly Regex _noiseLine = new(
        // TOC dot leaders: 4+ consecutive ". " or "."
        @"(\.\s*){4,}"
        // Running chapter headers: "Chapitre N — ... — ABBREV"
        + @"|^chapitre\s+\d+\s+[—\-]"
        // Figure captions: "Figure 1.3. Caption" or "Fig. 2: text"
        + @"|^(figure|fig\.)\s+\d[\d\.]*[\.\:\s]"
        // Table captions: "Table 1.4. Critique..."
        + @"|^(table|tableau|tab\.)\s+\d[\d\.]*[\.\:\s]"
        // Standalone Arabic page numbers (the entire line is just "1" to "999")
        + @"|^\d{1,4}$"
        // Standalone Roman numeral page numbers (i, ii, iii, iv … xii, etc.)
        + @"|^[ivxlcdmIVXLCDM]{1,6}$",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    // LaTeX hyphenated line-break: word ends with "word-" at line end
    private static readonly Regex _trailingHyphen = new(
        @"(\w)-$",
        RegexOptions.Compiled);

    public Task<string> ExtractTextAsync(Stream fileStream, string fileName)
    {
        using var pdf = PdfDocument.Open(fileStream);

        var pageTexts = new List<string>();

        foreach (var page in pdf.GetPages())
        {
            var text = ExtractCleanPage(page);
            if (!string.IsNullOrWhiteSpace(text))
                pageTexts.Add(text);
        }

        var fullText = string.Join("\n\n", pageTexts);

        // Normalise whitespace: collapse 3+ blank lines → 1
        fullText = Regex.Replace(fullText, @"\n{3,}", "\n\n").Trim();

        return Task.FromResult(fullText);
    }

    private string ExtractCleanPage(Page page)
    {
        // ── Step 1: group words into visual lines by Y-coordinate ────
        // PdfPig Y is measured from the bottom of the page.
        // Words on the same visual line share a similar Y-baseline (±3pt).
        var wordsByLine = page.GetWords()
            .Where(w => !string.IsNullOrWhiteSpace(w.Text))
            .GroupBy(w => Math.Round(w.BoundingBox.Bottom / 3.0))   // 3pt bucket
            .OrderByDescending(g => g.Key)                            // top → bottom
            .Select(g => g.OrderBy(w => w.BoundingBox.Left)
                          .Select(w => w.Text)
                          .ToList())
            .ToList();

        if (wordsByLine.Count == 0)
            return string.Empty;

        // ── Step 2: front-matter page check ─────────────────────────
        // If the very first line of this page is a front-matter title, skip all.
        var firstLine = string.Join(" ", wordsByLine[0]).Trim();
        if (_frontmatterPage.IsMatch(firstLine))
            return string.Empty;

        // ── Step 3: collect non-noise lines ──────────────────────────
        var lines = wordsByLine
            .Select(g => string.Join(" ", g).Trim())
            .Where(l => !string.IsNullOrWhiteSpace(l) && !_noiseLine.IsMatch(l))
            .ToList();

        if (lines.Count == 0)
            return string.Empty;

        // ── Step 4: re-join LaTeX hyphenated line-breaks ─────────────
        // e.g. "iden-" + "tité" → "identité"
        var sb = new StringBuilder();
        for (int i = 0; i < lines.Count; i++)
        {
            var line = lines[i];
            var m = _trailingHyphen.Match(line);
            if (m.Success && i + 1 < lines.Count)
            {
                // Append everything up to (but not including) the hyphen
                sb.Append(line.AsSpan(0, m.Index + m.Groups[1].Length));
                // The next line will be appended without a leading space
            }
            else
            {
                sb.Append(line);
                sb.Append(' ');
            }
        }

        return sb.ToString().Trim();
    }
}