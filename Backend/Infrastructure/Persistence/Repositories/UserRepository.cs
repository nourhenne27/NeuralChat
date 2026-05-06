using Microsoft.EntityFrameworkCore;
using Domain.Entities;
using Domain.Interfaces;
using Infrastructure.Persistence.Auth;

namespace Infrastructure.Persistence.Repositories;

public class UserRepository : IUserRepository
{
    private readonly SqlServerDbContext _context;

    public UserRepository(SqlServerDbContext context)
    {
        _context = context;
    }

    public async Task<User> GetByIdAsync(Guid id)
        => await _context.Users.FindAsync(id)
           ?? throw new KeyNotFoundException($"Utilisateur {id} introuvable.");

    public async Task<User> GetByEmailAsync(string email)
        => await _context.Users.FirstOrDefaultAsync(u => u.Email == email)
           ?? throw new KeyNotFoundException($"Aucun utilisateur avec l'email '{email}'.");

    /// <summary>
    /// Récupère tous les utilisateurs (utilisé par l'Admin)
    /// </summary>
    public async Task<IEnumerable<User>> GetAllAsync()
    {
        return await _context.Users
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync();
    }

    public async Task AddAsync(User user)
    {
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(User user)
    {
        if (_context.Entry(user).State == EntityState.Detached)
            _context.Users.Attach(user);

        _context.Entry(user).State = EntityState.Modified;
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user != null)
        {
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<bool> ExistsAsync(string email)
        => await _context.Users.AnyAsync(u => u.Email == email);
}