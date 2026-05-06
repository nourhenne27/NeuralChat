using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace Api.Middleware;

public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;

    public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        // Mapping exception → HTTP status code + titre lisible
        var (statusCode, title) = exception switch
        {
            UnauthorizedAccessException => (HttpStatusCode.Unauthorized, "Non autorisé"),
            KeyNotFoundException => (HttpStatusCode.NotFound, "Ressource introuvable"),
            InvalidOperationException => (HttpStatusCode.BadRequest, "Requête invalide"),
            ArgumentException => (HttpStatusCode.BadRequest, "Paramètre invalide"),
            NotSupportedException => (HttpStatusCode.UnprocessableEntity, "Opération non supportée"),
            _ => (HttpStatusCode.InternalServerError, "Erreur interne du serveur")
        };

        // Erreurs 5xx → log error complet ; erreurs 4xx → log warning (moins de bruit)
        if ((int)statusCode >= 500)
            _logger.LogError(exception, "Erreur serveur [{Status}]: {Message}", (int)statusCode, exception.Message);
        else
            _logger.LogWarning("Erreur client [{Status}]: {Message}", (int)statusCode, exception.Message);

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var problemDetails = new ProblemDetails
        {
            Status = context.Response.StatusCode,
            Title = title,
            Detail = exception.Message,
            Instance = context.Request.Path
        };

        var json = JsonSerializer.Serialize(problemDetails, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(json);
    }
}