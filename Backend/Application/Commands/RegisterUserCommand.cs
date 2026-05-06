using MediatR;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using Application.Abstractions;
using Application.DTOs;

namespace Application.Commands;
 
public record RegisterUserCommand(string Email, string Password, UserRole Role) : IRequest<AuthResponseDto>;

public class RegisterUserCommandHandler : IRequestHandler<RegisterUserCommand, AuthResponseDto>
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public RegisterUserCommandHandler(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtTokenGenerator)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<AuthResponseDto> Handle(RegisterUserCommand request, CancellationToken cancellationToken)
    {
        // CORRECTION : vérifier si l'email existe déjà et bloquer l'inscription
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

        var token = _jwtTokenGenerator.GenerateToken(user);

        return new AuthResponseDto
        {
            Token = token,
            UserId = user.Id,
            Email = user.Email,
            Role = user.Role.ToString()
        };
    }
}