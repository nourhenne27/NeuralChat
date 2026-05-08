using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Application.Commands;
using Application.Queries;
using Application.DTOs;
using Application.Common.Interfaces;

namespace Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUserService;

    public ChatController(IMediator mediator, ICurrentUserService currentUserService)
    {
        _mediator = mediator;
        _currentUserService = currentUserService;
    }

    // ===================== CREATE NEW SESSION =====================
    [HttpPost("session")]
    public async Task<IActionResult> CreateSession()
    {
        if (!_currentUserService.IsAuthenticated)
            return Unauthorized("Utilisateur non authentifié");

        var command = new CreateChatSessionCommand(_currentUserService.UserId);
        var sessionId = await _mediator.Send(command);

        return Ok(new { sessionId });
    }

    // ===================== SEND MESSAGE (Streaming SSE) =====================
    [HttpPost("send")]
    [Produces("text/event-stream")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task StreamMessage([FromBody] ChatRequestDto dto)
    {
        // ✅ SÉCURITÉ #1 : Vérification explicite du JWT AVANT tout header SSE
        if (!_currentUserService.IsAuthenticated)
        {
            Response.StatusCode = 401;
            await Response.WriteAsync("data: [ERROR] Token invalide ou expiré\n\n");
            await Response.Body.FlushAsync();
            return;
        }

        // Configuration des headers SSE
        // Access-Control-Allow-Origin retiré : géré globalement par la policy CORS
        // configurée dans Program.cs (AllowedOrigins lu depuis appsettings).
        Response.Headers["Content-Type"] = "text/event-stream";
        Response.Headers["Cache-Control"] = "no-cache";
        Response.Headers["Connection"] = "keep-alive";

        try
        {
            await foreach (var token in _mediator.CreateStream(
                new SendMessageStreamCommand(dto.SessionId, dto.Message)))
            {
                if (!string.IsNullOrEmpty(token))
                {
                    await Response.WriteAsync($"data: {token}\n\n");
                    await Response.Body.FlushAsync();
                }
            }

            await Response.WriteAsync("data: [DONE]\n\n");
            await Response.Body.FlushAsync();
        }
        catch (UnauthorizedAccessException)
        {
            Response.StatusCode = 401;
            await Response.WriteAsync("data: [ERROR] Token expiré ou invalide\n\n");
            await Response.Body.FlushAsync();
        }
        catch (Exception ex)
        {
            await Response.WriteAsync($"data: [ERROR] {ex.Message}\n\n");
            await Response.Body.FlushAsync();
        }
    }

    // ===================== DELETE SESSION =====================
    [HttpDelete("session/{sessionId:guid}")]
    public async Task<IActionResult> DeleteSession(Guid sessionId)
    {
        if (!_currentUserService.IsAuthenticated)
            return Unauthorized("Utilisateur non authentifié");

        await _mediator.Send(new DeleteChatSessionCommand(sessionId));
        return NoContent();
    }

    // ===================== GET HISTORY =====================
    [HttpGet("history/{sessionId:guid}")]
    public async Task<IActionResult> GetHistory(Guid sessionId)
    {
        if (!_currentUserService.IsAuthenticated)
            return Unauthorized("Utilisateur non authentifié");

        var result = await _mediator.Send(new GetChatHistoryQuery(sessionId));
        return Ok(result);
    }


    // ===================== RENAME SESSION =====================
    [HttpPatch("session/{sessionId:guid}/title")]
    public async Task<IActionResult> RenameSession(Guid sessionId, [FromBody] RenameSessionRequest request)
    {
        if (!_currentUserService.IsAuthenticated)
            return Unauthorized("Utilisateur non authentifié");

        if (string.IsNullOrWhiteSpace(request.Title))
            return BadRequest("Le titre ne peut pas être vide.");

        await _mediator.Send(new RenameSessionCommand(sessionId, request.Title));
        return NoContent();
    }

    // ===================== GET USER SESSIONS =====================
    [HttpGet("sessions")]
    public async Task<IActionResult> GetUserSessions()
    {
        if (!_currentUserService.IsAuthenticated)
            return Unauthorized("Utilisateur non authentifié");

        var result = await _mediator.Send(new GetUserSessionsQuery(_currentUserService.UserId));
        return Ok(result);
    }
}

public record RenameSessionRequest(string Title);