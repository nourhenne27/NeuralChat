using MediatR;
using Domain.Interfaces;
using Application.Abstractions;
using Application.DTOs;
using Application.Common.Interfaces;
using Domain.Entities;

namespace Application.Commands;

public record LoginUserCommand(string Email, string Password) : IRequest<AuthResponseDto>;

public class LoginUserCommandHandler : IRequestHandler<LoginUserCommand, AuthResponseDto>
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly ISqlServerDbContext _context;

    public LoginUserCommandHandler(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtTokenGenerator,
        ISqlServerDbContext context)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
        _context = context;
    }

    public async Task<AuthResponseDto> Handle(
        LoginUserCommand request,
        CancellationToken cancellationToken)
    {
        // 1. Vérifier l'email
        Domain.Entities.User user;
        try
        {
            user = await _userRepository.GetByEmailAsync(request.Email);
        }
        catch (KeyNotFoundException)
        {
            throw new UnauthorizedAccessException("Identifiants invalides");
        }

        // 2. Vérifier le mot de passe
        if (!_passwordHasher.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Identifiants invalides");

        // 3. Générer Access Token + Refresh Token
        var accessToken = _jwtTokenGenerator.GenerateToken(user);
        var refreshToken = _jwtTokenGenerator.GenerateRefreshToken();

        // 4. Sauvegarder le Refresh Token en base
        _context.RefreshTokens.Add(new RefreshToken
        {
            Token = refreshToken,
            UserId = user.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        });
        await _context.SaveChangesAsync(cancellationToken);

        return new AuthResponseDto
        {
            Token = accessToken,
            RefreshToken = refreshToken,
            UserId = user.Id,
            Email = user.Email,
            Role = user.Role.ToString()
        };
    }
}