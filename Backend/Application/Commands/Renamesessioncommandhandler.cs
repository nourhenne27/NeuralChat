using MediatR;
using Domain.Interfaces;
using Application.Common.Interfaces;

namespace Application.Commands;

public class RenameSessionCommandHandler : IRequestHandler<RenameSessionCommand, Unit>
{
    private readonly IChatSessionRepository _repo;
    private readonly ICurrentUserService _currentUser;

    public RenameSessionCommandHandler(IChatSessionRepository repo, ICurrentUserService currentUser)
    {
        _repo = repo;
        _currentUser = currentUser;
    }

    public async Task<Unit> Handle(RenameSessionCommand request, CancellationToken cancellationToken)
    {
        if (!_currentUser.IsAuthenticated)
            throw new UnauthorizedAccessException("Utilisateur non authentifié.");

        var session = await _repo.GetByIdAsync(request.SessionId);

        if (session.UserId != _currentUser.UserId && !_currentUser.IsInRole("Admin"))
            throw new UnauthorizedAccessException("Accès refusé.");

        var title = request.NewTitle.Trim();
        if (string.IsNullOrWhiteSpace(title)) title = "Nouvelle conversation";
        if (title.Length > 100) title = title[..100];

        session.Title = title;
        await _repo.UpdateAsync(session);

        return Unit.Value;
    }
}