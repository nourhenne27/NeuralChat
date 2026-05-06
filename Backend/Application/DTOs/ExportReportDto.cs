namespace Application.DTOs;

public class ExportReportDto
{
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    public AdminStatsDto Stats { get; set; } = null!;
    public IEnumerable<UserDto> Users { get; set; } = [];
    public IEnumerable<ActivityItemDto> RecentActivity { get; set; } = [];
}