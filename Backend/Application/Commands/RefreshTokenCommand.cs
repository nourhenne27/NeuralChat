using Application.Abstractions;
using Application.DTOs;
using Domain.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Application.Common.Interfaces;

namespace Application.Commands;

public record RefreshTokenCommand(string RefreshToken) : IRequest<AuthResponseDto>;

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, AuthResponseDto>
{
    private readonly ISqlServerDbContext _context;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public RefreshTokenCommandHandler(
        ISqlServerDbContext context,
        IJwtTokenGenerator jwtTokenGenerator)
    {
        _context = context;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<AuthResponseDto> Handle(
        RefreshTokenCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Chercher le refresh token en base
        var existing = await _context.RefreshTokens
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Token == request.RefreshToken, cancellationToken);

        // 2. Token introuvable
        if (existing == null)
            throw new UnauthorizedAccessException("Refresh token invalide.");

        // 3. Protection contre le token replay — token déjà révoqué
        if (existing.IsRevoked)
        {
            // Invalider tous les tokens de la session (sécurité)
            var allTokens = _context.RefreshTokens
                .Where(r => r.UserId == existing.UserId);
            foreach (var t in allTokens)
                t.IsRevoked = true;
            await _context.SaveChangesAsync(cancellationToken);
            throw new UnauthorizedAccessException("Refresh token réutilisé. Session invalidée.");
        }

        // 4. Token expiré
        if (existing.IsExpired)
            throw new UnauthorizedAccessException("Refresh token expiré.");

        // 5. Révoquer l'ancien token
        existing.IsRevoked = true;

        // 6. Générer un nouvel Access Token + Refresh Token
        var newAccessToken = _jwtTokenGenerator.GenerateToken(existing.User);
        var newRefreshToken = _jwtTokenGenerator.GenerateRefreshToken();

        _context.RefreshTokens.Add(new Domain.Entities.RefreshToken
        {
            Token = newRefreshToken,
            UserId = existing.UserId,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        });

        await _context.SaveChangesAsync(cancellationToken);

        return new AuthResponseDto
        {
            Token = newAccessToken,
            RefreshToken = newRefreshToken,
            UserId = existing.User.Id,
            Email = existing.User.Email,
            Role = existing.User.Role.ToString()
        };
    }
}