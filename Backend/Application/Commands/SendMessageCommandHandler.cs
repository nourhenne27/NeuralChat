using MediatR;
using Domain.Interfaces;
using Application.DTOs;
using Application.Services;
using Domain.Entities;
using Application.Common.Interfaces;

namespace Application.Commands;

public class SendMessageCommandHandler
    : IRequestHandler<SendMessageCommand, ChatResponseDto>
{
    private readonly RAGService _ragService;
    private readonly IChatSessionRepository _chatSessionRepository;
    private readonly ICurrentUserService _currentUserService;

    public SendMessageCommandHandler(
        RAGService ragService,
        IChatSessionRepository chatSessionRepository,
        ICurrentUserService currentUserService)
    {
        _ragService = ragService;
        _chatSessionRepository = chatSessionRepository;
        _currentUserService = currentUserService;
    }

    public async Task<ChatResponseDto> Handle(
        SendMessageCommand request,
        CancellationToken cancellationToken)
    {
        if (!_currentUserService.IsAuthenticated)
            throw new UnauthorizedAccessException("Utilisateur non authentifié.");

        var userId = _currentUserService.UserId;
        Guid sessionId;

        // ===================== SESSION =====================
        if (request.SessionId == null || request.SessionId == Guid.Empty)
        {
            var newSession = new ChatSession
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = request.UserMessage.Length > 60
                    ? request.UserMessage.Substring(0, 57) + "..."
                    : request.UserMessage,
                CreatedAt = DateTime.UtcNow
            };
            await _chatSessionRepository.AddAsync(newSession);
            sessionId = newSession.Id;
        }
        else
        {
            sessionId = request.SessionId.Value;
        }

        // Vérification que la session existe bien
        var session = await _chatSessionRepository.GetByIdAsync(sessionId);
        if (session == null)
            throw new KeyNotFoundException("Session introuvable.");

        // ===================== APPEL RAG =====================
        var (assistantResponse, sources) = await _ragService.GetResponseAsync(
            request.UserMessage,
            sessionId);

        // ===================== SAUVEGARDE =====================
        // ✅ Utilise AddMessagesAsync (direct INSERT) comme le handler streaming
        // → évite les doublons et la logique complexe de UpdateAsync
        var userMessage = new ChatMessage
        {
            Id = Guid.NewGuid(),
            SessionId = sessionId,
            Role = "user",
            Content = request.UserMessage,
            CreatedAt = DateTime.UtcNow
        };

        var assistantMessage = new ChatMessage
        {
            Id = Guid.NewGuid(),
            SessionId = sessionId,
            Role = "assistant",
            Content = assistantResponse,
            CreatedAt = DateTime.UtcNow.AddMilliseconds(1)
        };

        await _chatSessionRepository.AddMessagesAsync(sessionId, userMessage, assistantMessage);

        return new ChatResponseDto
        {
            Message = assistantResponse,
            Sources = sources
        };
    }
}