using MediatR;
using Application.DTOs;

namespace Application.Commands;

public record SendMessageCommand(
    Guid? SessionId,           // ← Changé en nullable
    string UserMessage
) : IRequest<ChatResponseDto>;