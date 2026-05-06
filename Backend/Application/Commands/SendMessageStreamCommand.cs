using MediatR;

namespace Application.Commands;

public record SendMessageStreamCommand(Guid? SessionId, string Message)
    : IStreamRequest<string>;