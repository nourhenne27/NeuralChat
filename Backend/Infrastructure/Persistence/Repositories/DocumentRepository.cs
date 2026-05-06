using Microsoft.EntityFrameworkCore;
using Domain.Interfaces;
using Domain.Enums;
using Domain.Entities;
using Infrastructure.Persistence.RAG;

namespace Infrastructure.Persistence.Repositories;

public class DocumentRepository : IDocumentRepository
{
    private readonly VectorDbContext _context;

    public DocumentRepository(VectorDbContext context)
    {
        _context = context;
    }

    public async Task<Document> GetByIdAsync(Guid id)
        => await _context.Documents
            .Include(d => d.Chunks)
            .FirstOrDefaultAsync(d => d.Id == id)
           ?? throw new KeyNotFoundException($"Document {id} introuvable.");

    public async Task<IEnumerable<Document>> GetAllAsync(UserRole userRole)
        // Logique : Admin=0, Manager=1, User=2
        // Un document avec RoleRequired=0 (Admin) ne doit être visible que par Admin (0).
        // Un document avec RoleRequired=2 (User) est visible par tout le monde.
        // Règle : userRole <= RoleRequired  →  plus le rôle est petit, plus il est privilégié.
        // Exemple : Admin (0) voit tout (0 <= 0, 0 <= 1, 0 <= 2) ✓
        //           Manager (1) voit Manager + User (1 <= 1, 1 <= 2) ✓
        //           User (2) voit seulement User (2 <= 2) ✓
        => await _context.Documents
            .Where(d => (int)userRole <= (int)d.RoleRequired)
            .OrderByDescending(d => d.UploadedAt)
            .ToListAsync();

    public async Task AddAsync(Document document)
    {
        await _context.Documents.AddAsync(document);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(Document document)
    {
        if (_context.Entry(document).State == EntityState.Detached)
            _context.Documents.Attach(document);

        _context.Entry(document).State = EntityState.Modified;
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid id)
    {
        var document = await _context.Documents.FindAsync(id);
        if (document != null)
        {
            _context.Documents.Remove(document);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<bool> ExistsAsync(Guid id)
        => await _context.Documents.AnyAsync(d => d.Id == id);
}