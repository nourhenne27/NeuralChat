using Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Commands;

public record LogoutCommand(string RefreshToken) : IRequest;

public class LogoutCommandHandler : IRequestHandler<LogoutCommand>
{
    private readonly ISqlServerDbContext _context;

    public LogoutCommandHandler(ISqlServerDbContext context)
    {
        _context = context;
    }

    public async Task Handle(LogoutCommand request, CancellationToken cancellationToken)
    {
        var token = await _context.RefreshTokens
            .FirstOrDefaultAsync(r => r.Token == request.RefreshToken, cancellationToken);

        if (token is not null)
        {
            token.IsRevoked = true;
            await _context.SaveChangesAsync(cancellationToken);
        }
    }
}