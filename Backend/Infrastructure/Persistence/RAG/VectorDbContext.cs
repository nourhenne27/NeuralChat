using Application.Common.Interfaces;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Pgvector.EntityFrameworkCore;

namespace Infrastructure.Persistence.RAG;

public class VectorDbContext : DbContext, IVectorDbContext
{
    public VectorDbContext(DbContextOptions<VectorDbContext> options)
        : base(options)
    {
    }

    public DbSet<Document> Documents { get; set; }
    public DbSet<DocumentChunk> DocumentChunks { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.HasPostgresExtension("vector");

        modelBuilder.Entity<Document>().ToTable("Documents");
        modelBuilder.Entity<DocumentChunk>().ToTable("DocumentChunks");

        modelBuilder.Entity<DocumentChunk>()
            .Property(x => x.Embedding)
            .HasColumnType("vector(768)");

        modelBuilder.Entity<DocumentChunk>()
            .HasIndex(x => x.Embedding)
            .HasMethod("hnsw")
            .HasOperators("vector_cosine_ops");

        modelBuilder.Entity<DocumentChunk>()
            .HasOne(c => c.Document)
            .WithMany(d => d.Chunks)
            .HasForeignKey(c => c.DocumentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}