using MediatR;
using Domain.Enums;
using Application.DTOs;

namespace Application.Queries;

public record GetDocumentsQuery(UserRole UserRole) : IRequest<List<DocumentDto>>;
