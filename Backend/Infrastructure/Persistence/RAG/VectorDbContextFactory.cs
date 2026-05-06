using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Pgvector.EntityFrameworkCore;

namespace Infrastructure.Persistence.RAG;

public class VectorDbContextFactory : IDesignTimeDbContextFactory<VectorDbContext>
{
    public VectorDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<VectorDbContext>();

        optionsBuilder.UseNpgsql(
            "Host=localhost;Database=api_vectors;Username=postgres;Password=pfechatbot;TrustServerCertificate=true;",
            b =>
            {
                b.MigrationsAssembly("Infrastructure");
                b.UseVector();
            }
        );

        return new VectorDbContext(optionsBuilder.Options);
    }
}