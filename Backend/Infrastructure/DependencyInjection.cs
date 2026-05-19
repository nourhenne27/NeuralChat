using Application.Abstractions;
using Application.Common.Interfaces;
using Application.Services;
using Domain.Interfaces;
using Infrastructure.Auth;
using Infrastructure.Embedding;
using Infrastructure.FileProcessing;
using Infrastructure.LLM;
using Infrastructure.Options;
using Infrastructure.Persistence.Auth;
using Infrastructure.Persistence.RAG;
using Infrastructure.Persistence.Repositories;
using Infrastructure.Services;
using Infrastructure.VectorStore;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // ====================== OPTIONS ======================
        services.Configure<JwtOptions>(
            configuration.GetSection(JwtOptions.SectionName));

        services.Configure<OllamaOptions>(
            configuration.GetSection(OllamaOptions.SectionName));

        services.Configure<ChunkingOptions>(
            configuration.GetSection(ChunkingOptions.SectionName));

        // ====================== DATABASES ======================
        services.AddDbContext<SqlServerDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString("SqlServer"),
                b => b.MigrationsAssembly(typeof(SqlServerDbContext).Assembly.GetName().Name)
            )); 

        services.AddDbContext<VectorDbContext>(options =>
            options.UseNpgsql(
                configuration.GetConnectionString("Postgres"),
                b =>
                {
                    b.MigrationsAssembly(typeof(VectorDbContext).Assembly.GetName().Name);
                    b.UseVector();
                }
            ));

        // ====================== CURRENT USER ======================
        // Note : AddHttpContextAccessor() est appelé dans Program.cs (projet api)
        // car la méthode d'extension n'existe pas dans Microsoft.AspNetCore.Http.Abstractions.
        // On enregistre uniquement ICurrentUserService ici.
        services.AddScoped<ICurrentUserService, CurrentUserService>();

        // ====================== SERVICES ======================
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IVectorStore, VectorStoreService>();

        // Extracteurs enregistrés individuellement — requis par FileTextExtractorFactory
        services.AddScoped<PdfExtractor>();
        services.AddScoped<WordExtractor>();
        services.AddScoped<TextExtractor>();
        services.AddScoped<IFileTextExtractor, FileTextExtractorFactory>();

        services.AddScoped<ChunkingService>();
        services.AddScoped<PromptBuilderService>();
        services.AddScoped<RAGService>();

        // HttpClients typés pour Ollama
        services.AddHttpClient<IEmbeddingService, EmbeddingService>();
        services.AddHttpClient<ILLMService, LLMService>();

        // ====================== REPOSITORIES ======================
        services.AddScoped<IDocumentRepository, DocumentRepository>();
        services.AddScoped<IChatSessionRepository, ChatSessionRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IFeedbackRepository, FeedbackRepository>();

        // ====================== MEDIATR ======================
        // Application  → tous les Command/Query handlers existants
        // Infrastructure → couvre les futurs handlers Infrastructure
        // Note : RegisterServicesFromAssemblyContaining<T> requiert un type non-static.
        // On utilise LLMService comme anchor de l'assembly Infrastructure.
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(typeof(ChunkingService).Assembly);
            cfg.RegisterServicesFromAssemblyContaining<LLMService>();
        });

        return services;
    }
}