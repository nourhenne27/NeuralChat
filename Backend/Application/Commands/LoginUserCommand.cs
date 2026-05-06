using MediatR;
using Domain.Interfaces;
using Application.Abstractions;
using Application.DTOs;

namespace Application.Commands;
 
public record LoginUserCommand(string Email, string Password) : IRequest<AuthResponseDto>;

public class LoginUserCommandHandler : IRequestHandler<LoginUserCommand, AuthResponseDto>
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public LoginUserCommandHandler(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtTokenGenerator)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<AuthResponseDto> Handle(LoginUserCommand request, CancellationToken cancellationToken)
    {
        // CORRECTION : GetByEmailAsync lance KeyNotFoundException si l'email n'existe pas
        // On l'attrape pour retourner un message générique (sécurité : ne pas révéler si l'email existe)
        Domain.Entities.User user;
        try
        {
            user = await _userRepository.GetByEmailAsync(request.Email);
        }
        catch (KeyNotFoundException)
        {
            throw new UnauthorizedAccessException("Identifiants invalides");
        }

        if (!_passwordHasher.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Identifiants invalides");

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
 