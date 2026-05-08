namespace Application.DTOs;

public class SourceDto
{
    public string DocumentTitle { get; set; } = string.Empty;
    public string Excerpt { get; set; } = string.Empty;
    public double Score { get; set; }
}