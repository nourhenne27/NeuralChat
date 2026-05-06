using MediatR;
using Application.Services;
using Domain.Entities;
using Domain.Interfaces;
using Application.Common.Interfaces;
using System.Text;
using System.Text.Json;
using System.Runtime.CompilerServices;

namespace Application.Commands;

public class SendMessageStreamCommandHandler
    : IStreamRequestHandler<SendMessageStreamCommand, string>
{
    private readonly RAGService _ragService;
    private readonly IChatSessionRepository _chatSessionRepository;
    private readonly ICurrentUserService _currentUserService;

    public SendMessageStreamCommandHandler(
        RAGService ragService,
        IChatSessionRepository chatSessionRepository,
        ICurrentUserService currentUserService)
    {
        _ragService = ragService;
        _chatSessionRepository = chatSessionRepository;
        _currentUserService = currentUserService;
    }

    public async IAsyncEnumerable<string> Handle(
        SendMessageStreamCommand request,
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        if (!_currentUserService.IsAuthenticated)
            throw new UnauthorizedAccessException("Utilisateur non authentifié.");

        var userId = _currentUserService.UserId;
        Guid sessionId;

        // ===================== CRÉATION DE SESSION SI NÉCESSAIRE =====================
        if (request.SessionId == null || request.SessionId == Guid.Empty)
        {
            var title = request.Message.Length > 60
                ? request.Message.Substring(0, 57) + "..."
                : request.Message;

            var newSession = new ChatSession
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = title,
                CreatedAt = DateTime.UtcNow
            };

            await _chatSessionRepository.AddAsync(newSession);
            sessionId = newSession.Id;
            yield return $"[SESSION:{sessionId}]";
        }
        else
        {
            sessionId = request.SessionId.Value;
        }

        // ===================== STREAMING =====================
        var fullResponse = new StringBuilder();
        var sourcesRaw = string.Empty;

        await foreach (var token in _ragService.GetResponseStreamAsync(request.Message, sessionId)
            .WithCancellation(cancellationToken))
        {
            if (token.StartsWith("[SOURCES_DATA]"))
            {
                sourcesRaw = token[14..];
                continue;
            }

            fullResponse.Append(token);
            yield return token;
        }

        // ===================== ENVOI DES SOURCES AU FRONTEND =====================
        if (!string.IsNullOrEmpty(sourcesRaw))
        {
            yield return $"[SOURCES]{sourcesRaw}";
        }

        // ===================== SAUVEGARDE EN BASE =====================
        var userMessage = new ChatMessage
        {
            Id = Guid.NewGuid(),
            SessionId = sessionId,
            Role = "user",
            Content = request.Message,
            CreatedAt = DateTime.UtcNow
        };

        var assistantMessage = new ChatMessage
        {
            Id = Guid.NewGuid(),
            SessionId = sessionId,
            Role = "assistant",
            Content = fullResponse.ToString(),
            CreatedAt = DateTime.UtcNow.AddMilliseconds(1)
        };

        await _chatSessionRepository.AddMessagesAsync(sessionId, userMessage, assistantMessage);

        // ✅ Envoyer l'ID du message assistant au frontend pour le feedback
        yield return $"[MESSAGE_ID:{assistantMessage.Id}]";
    }
}