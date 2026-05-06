using MediatR;
using Domain.Interfaces;
using Application.Common.Interfaces;

namespace Application.Commands;

public class DeleteChatSessionCommandHandler
    : IRequestHandler<DeleteChatSessionCommand, Unit>
{
    private readonly IChatSessionRepository _chatSessionRepository;
    private readonly ICurrentUserService _currentUserService;

    public DeleteChatSessionCommandHandler(
        IChatSessionRepository chatSessionRepository,
        ICurrentUserService currentUserService)
    {
        _chatSessionRepository = chatSessionRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Unit> Handle(DeleteChatSessionCommand request, CancellationToken cancellationToken)
    {
        if (!_currentUserService.IsAuthenticated)
            throw new UnauthorizedAccessException("Utilisateur non authentifié.");

        var session = await _chatSessionRepository.GetByIdAsync(request.SessionId);

        if (session == null)
            throw new KeyNotFoundException("Session introuvable.");

        // Sécurité : Vérification des droits
        bool isAdmin = _currentUserService.IsInRole("Admin");   // ← Correction ici

        if (session.UserId != _currentUserService.UserId && !isAdmin)
        {
            throw new UnauthorizedAccessException("Vous ne pouvez pas supprimer cette session.");
        }

        await _chatSessionRepository.DeleteAsync(request.SessionId);

        return Unit.Value;
    }
}