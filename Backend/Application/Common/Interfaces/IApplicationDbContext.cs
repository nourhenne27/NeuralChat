using Domain.Entities;
using Microsoft.EntityFrameworkCore;

public interface ISqlServerDbContext
{
    DbSet<ChatSession> ChatSessions { get; }
    DbSet<Feedback> Feedbacks { get; }
}