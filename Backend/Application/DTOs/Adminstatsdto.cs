namespace Application.DTOs;

public class AdminStatsDto
{
    public int TotalQuestions { get; set; }
    public int TotalDocuments { get; set; }
    public int TotalUsers { get; set; }
    public double AverageConfidenceScore { get; set; }
}
