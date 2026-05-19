using MediatR;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using Application.Abstractions;
using Application.Common.Interfaces;
using Application.DTOs;

namespace Application.Commands;

public record RegisterUserCommand(string Email, string Password, UserRole Role) : IRequest<AuthResponseDto>;

public class RegisterUserCommandHandler : IRequestHandler<RegisterUserCommand, AuthResponseDto>
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly ISqlServerDbContext _context;

    public RegisterUserCommandHandler(
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

    public async Task<AuthResponseDto> Handle(RegisterUserCommand request, CancellationToken cancellationToken)
    {
        bool emailExists = true;
        try { await _userRepository.GetByEmailAsync(request.Email); }
        catch (KeyNotFoundException) { emailExists = false; }

        if (emailExists)
            throw new InvalidOperationException("Un compte avec cet email existe déjà.");

        var user = new User
        {
            Email = request.Email,
            PasswordHash = _passwordHasher.Hash(request.Password),
            Role = request.Role
        };

        await _userRepository.AddAsync(user);

        var accessToken = _jwtTokenGenerator.GenerateToken(user);
        var refreshToken = _jwtTokenGenerator.GenerateRefreshToken();

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
