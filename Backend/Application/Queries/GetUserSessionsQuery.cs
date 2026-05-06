using MediatR;
using Application.DTOs;

namespace Application.Queries;

public record GetUserSessionsQuery(Guid UserId) : IRequest<List<ChatSessionDto>>;