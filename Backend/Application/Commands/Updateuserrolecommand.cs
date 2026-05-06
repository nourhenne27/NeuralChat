using Domain.Enums;
using MediatR;

namespace Application.Commands;

public record UpdateUserRoleCommand(Guid UserId, UserRole NewRole) : IRequest;