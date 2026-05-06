namespace Application.Services;

public class ChunkingOptions
{
    public const string SectionName = "Chunking";

    public int ChunkSize { get; set; } = 500;
    public int ChunkOverlap { get; set; } = 100;

    /// <summary>
    /// Nombre de chunks les plus pertinents à récupérer
    /// Valeur recommandée : 6 à 8 pour un bon équilibre précision/vitesse
    /// </summary>
    public int TopK { get; set; } = 7;                    // ← Augmenté

    /// <summary>
    /// Seuil de similarité cosine (0.75 était trop strict)
    /// Valeur recommandée pour nomic-embed-text : entre 0.68 et 0.72
    /// </summary>
    public float SimilarityThreshold { get; set; } = 0.70f;   // ← Abaissé
}