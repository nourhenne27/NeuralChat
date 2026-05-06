using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Infrastructure.Persistence.Auth;

public class SqlServerDbContextFactory : IDesignTimeDbContextFactory<SqlServerDbContext>
{
    public SqlServerDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<SqlServerDbContext>();

        optionsBuilder.UseSqlServer(
            "Server=.\\VE_SERVER;Database=api_auth;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true;",
            b => b.MigrationsAssembly("Infrastructure")
        );

        return new SqlServerDbContext(optionsBuilder.Options);
    }
}