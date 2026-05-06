using MediatR;
using Application.DTOs;

namespace Application.Queries;

public record GetAllUsersQuery : IRequest<List<UserDto>>;