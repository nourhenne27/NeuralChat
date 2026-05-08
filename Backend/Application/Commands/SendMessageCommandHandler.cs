using MediatR;
using Domain.Interfaces;
using Application.DTOs;
using Application.Services;
using Domain.Entities;
using Application.Common.Interfaces;
using System.Text.Json;

namespace Application.Commands;

public class SendMessageCommandHandler
    : IRequestHandler<SendMessageCommand, ChatResponseDto>
{
    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

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

        if (request.SessionId == null || request.SessionId == Guid.Empty)
        {
            var title = request.UserMessage.Length > 60
                ? string.Concat(request.UserMessage.AsSpan(0, 57), "...")
                : request.UserMessage;

            var newSession = new ChatSession
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = title,
                CreatedAt = DateTime.UtcNow
            };
            await _chatSessionRepository.AddAsync(newSession);
            sessionId = newSession.Id;
        }
        else
        {
            sessionId = request.SessionId.Value;
        }

        var session = await _chatSessionRepository.GetByIdAsync(sessionId);
        if (session == null)
            throw new KeyNotFoundException("Session introuvable.");

        var (assistantResponse, sources) = await _ragService.GetResponseAsync(
            request.UserMessage, sessionId);

        var sourcesJson = sources.Count > 0
            ? JsonSerializer.Serialize(sources, _jsonOptions)
            : null;

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
            CreatedAt = DateTime.UtcNow.AddMilliseconds(1),
            SourcesJson = sourcesJson
        };

        await _chatSessionRepository.AddMessagesAsync(sessionId, userMessage, assistantMessage);

        return new ChatResponseDto
        {
            Message = assistantResponse,
            Sources = sources,
            SessionId = sessionId
        };
    }
}