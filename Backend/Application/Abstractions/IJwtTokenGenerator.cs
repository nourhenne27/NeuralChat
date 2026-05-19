using Domain.Entities;

namespace Application.Abstractions;

public interface IJwtTokenGenerator
{
    string GenerateToken(User user);
    string GenerateRefreshToken();
}