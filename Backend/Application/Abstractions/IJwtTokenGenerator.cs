namespace Application.Abstractions;

public interface IJwtTokenGenerator
{
    string GenerateToken(Domain.Entities.User user);
}
