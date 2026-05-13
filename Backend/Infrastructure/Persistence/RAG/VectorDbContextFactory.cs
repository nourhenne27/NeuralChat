using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;


namespace Infrastructure.Persistence.RAG;

public class VectorDbContextFactory : IDesignTimeDbContextFactory<VectorDbContext>
{
    public VectorDbContext CreateDbContext(string[] args)
    {
        var configuration = new ConfigurationBuilder()
            .AddJsonFile(
                Path.Combine(Directory.GetCurrentDirectory(), "../Api/appsettings.json"),
                optional: false)
            .AddJsonFile(
                Path.Combine(Directory.GetCurrentDirectory(), "../Api/appsettings.Development.json"),
                optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = configuration.GetConnectionString("VectorDb")
            ?? throw new InvalidOperationException(
                "Connection string 'VectorDb' not found.");

        var optionsBuilder = new DbContextOptionsBuilder<VectorDbContext>();
        optionsBuilder.UseNpgsql(
            connectionString,
            b =>
            {
                b.MigrationsAssembly("Infrastructure");
                b.UseVector();
            }
        );

        return new VectorDbContext(optionsBuilder.Options);
    }
}