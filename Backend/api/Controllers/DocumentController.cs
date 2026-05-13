using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Application.Commands;
using Application.Queries;
using Domain.Enums;
using System.Security.Claims;

namespace Api.Controllers;

public class UploadDocumentRequest
{
    public IFormFile File { get; set; } = null!;
}

public record UpdateDocumentRoleRequest(UserRole RoleRequired);

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class DocumentController : ControllerBase
{
    private readonly IMediator _mediator;

    public DocumentController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("upload")]
    [Authorize(Roles = "Admin,Manager")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadDocument(
        [FromForm] UploadDocumentRequest request,
        [FromQuery] UserRole roleRequired = UserRole.User)
    {
        var file = request.File;
        if (file == null || file.Length == 0)
            return BadRequest("Aucun fichier envoyé.");

        var ext = Path.GetExtension(file.FileName).TrimStart('.').ToLowerInvariant();
        var formatsAcceptes = new[] { "pdf", "docx", "txt", "md" };
        if (!formatsAcceptes.Contains(ext))
            return BadRequest($"Format '{ext}' non supporté. Formats acceptés : pdf, docx, txt, md.");

        byte[] fileContent;
        using (var ms = new MemoryStream())
        {
            await file.CopyToAsync(ms);
            fileContent = ms.ToArray();
        }

        var command = new IndexDocumentCommand(fileContent, file.FileName, roleRequired);
        var result = await _mediator.Send(command);
        return Ok(result);
    }

    [HttpGet]
    public async Task<IActionResult> GetDocuments()
    {
        var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
        var role = Enum.TryParse<UserRole>(roleClaim, true, out var parsedRole)
            ? parsedRole
            : UserRole.User;

        var result = await _mediator.Send(new GetDocumentsQuery(role));
        return Ok(result);
    }

    // ✅ Nouveau endpoint — modifier le rôle d'accès d'un document
    [HttpPatch("{id:guid}/role")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> UpdateDocumentRole(
        Guid id,
        [FromBody] UpdateDocumentRoleRequest request)
    {
        if (!Enum.IsDefined(typeof(UserRole), request.RoleRequired))
            return BadRequest("Rôle invalide.");

        await _mediator.Send(new UpdateDocumentRoleCommand(id, request.RoleRequired));
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> DeleteDocument(Guid id)
    {
        await _mediator.Send(new DeleteDocumentCommand(id));
        return NoContent();
    }
}